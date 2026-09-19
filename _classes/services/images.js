const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, FileBuilder } = require('@discordjs/builders');
const cacheLists = require('./cacheLists');
const clientService = require('./clientService');
class ImagesService {
constructor() {
const img = this;
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sharp = require('sharp');
const opentype = require('opentype.js');
const { reportError } = require('../debug');

const resourcesPath = path.resolve(__dirname, '../../resources');
const MAX_REMOTE_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 32_000_000;
const MAX_LOCAL_IMAGE_CACHE_ENTRIES = 256;
const PNG_OPTIONS = { compressionLevel: 9, adaptiveFiltering: true };
const localImageCache = new Map();
const pendingLocalLoads = new Map();
let redisUnavailableUntil = 0;

const ASSET_GROUPS = {
    battle: {
        bg: './resources/backgrounds/company/battle.png',
        deadbg: './resources/backgrounds/company/dead.png'
    },
    blackjack: {
        bg: './resources/backgrounds/cartas/game.png'
    },
    machine: {
        bg: './resources/backgrounds/maq/maqbackground.png',
        locked: './resources/backgrounds/maq/locked.png',
        locked2: './resources/backgrounds/maq/locked2.png',
        rachadura1: './resources/backgrounds/rachaduras/1.png',
        rachadura2: './resources/backgrounds/rachaduras/2.png',
        rachadura3: './resources/backgrounds/rachaduras/3.png',
        rachadura4: './resources/backgrounds/rachaduras/4.png',
        rachadura5: './resources/backgrounds/rachaduras/5.png'
    },
    profile: {
        bg: './resources/backgrounds/profile/profile.png'
    },
    map: {
        bg: './resources/backgrounds/map/map.png',
        mark: './resources/backgrounds/map/mark.png',
        treasureicon: './resources/backgrounds/map/treasure.png',
        duckicon: './resources/backgrounds/map/duck.png'
    },
    levelup: {
        bg: './resources/backgrounds/profile/levelup.png'
    },
    seecompany: {
        bg: './resources/backgrounds/company/background.png'
    }
};

const assetCache = new Map();
let assetsReady;

class SharpImage {
    constructor(data, width, height, format = 'png') {
        this.data = data;
        this.width = width;
        this.height = height;
        this.format = format;
    }

    async toBuffer() {
        return this.data;
    }
}

function dataUriToBuffer(value) {
    const match = value.match(/^data:[^;]+;base64,(.+)$/s);
    return match ? Buffer.from(match[1], 'base64') : null;
}

async function readSource(source) {
    if (source instanceof SharpImage) return source.data;
    if (source instanceof ImageComposer) return source.toBuffer();
    if (Buffer.isBuffer(source)) return source;
    if (source && Buffer.isBuffer(source.data)) return source.data;
    if (typeof source !== 'string') throw new TypeError('Invalid image source');

    const dataUri = dataUriToBuffer(source);
    if (dataUri) return dataUri;

    if (/^https?:\/\//i.test(source)) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        try {
            const response = await fetch(source, { signal: controller.signal });
            if (!response.ok) throw new Error(`Image request failed with status ${response.status}`);
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.toLowerCase().startsWith('image/')) throw new Error('Remote resource is not an image');
            const contentLength = Number(response.headers.get('content-length'));
            if (contentLength > MAX_REMOTE_IMAGE_BYTES) throw new Error('Remote image is too large');
            const data = await response.buffer();
            if (data.length > MAX_REMOTE_IMAGE_BYTES) throw new Error('Remote image is too large');
            return data;
        } finally {
            clearTimeout(timeout);
        }
    }

    return fs.promises.readFile(source);
}

async function imageFrom(source) {
    const data = await readSource(source);
    const metadata = await sharp(data).metadata();
    if (!metadata.width || !metadata.height) throw new Error('Image dimensions are unavailable');
    if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) throw new Error('Image dimensions exceed the supported limit');
    return new SharpImage(data, metadata.width, metadata.height, metadata.format);
}

function getCacheableFilePath(source) {
    if (typeof source !== 'string') return null;

    const filePath = path.resolve(process.cwd(), source);
    const relativePath = path.relative(resourcesPath, filePath);
    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) return null;
    return filePath;
}

async function loadImage(source) {
    const filePath = getCacheableFilePath(source);
    if (!filePath) return imageFrom(source);

    const fileStats = await fs.promises.stat(filePath);
    const version = `${fileStats.mtimeMs}:${fileStats.size}`;
    const cacheName = `resources/${path.relative(resourcesPath, filePath).replace(/\\/g, '/')}`;
    const cacheKey = `${filePath}:${version}`;
    const cached = localImageCache.get(cacheKey);
    if (cached) {
        localImageCache.delete(cacheKey);
        localImageCache.set(cacheKey, cached);
        return cached;
    }

    if (pendingLocalLoads.has(cacheKey)) return pendingLocalLoads.get(cacheKey);

    const load = loadLocalImage(filePath, cacheName, version);
    pendingLocalLoads.set(cacheKey, load);
    try {
        return await load;
    } finally {
        pendingLocalLoads.delete(cacheKey);
    }
}

async function loadLocalImage(filePath, cacheName, version) {
    const redisImage = await getRedisImage(cacheName, version);
    if (redisImage) return rememberLocalImage(`${filePath}:${version}`, redisImage);

    const file = await fs.promises.readFile(filePath);
    const image = await imageFrom(file);
    rememberLocalImage(`${filePath}:${version}`, image);
    await setRedisImage(cacheName, version, file);
    return image;
}

function rememberLocalImage(key, image) {
    localImageCache.set(key, image);
    while (localImageCache.size > MAX_LOCAL_IMAGE_CACHE_ENTRIES) {
        localImageCache.delete(localImageCache.keys().next().value);
    }
    return image;
}

async function getRedisImage(filePath, version) {
    const images = cacheLists?.images;
    if (!images || Date.now() < redisUnavailableUntil) return null;

    try {
        const cached = await images.get(filePath, version);
        return cached ? imageFrom(Buffer.from(cached, 'base64')) : null;
    } catch (error) {
        redisUnavailableUntil = Date.now() + 30_000;
        reportError(error, 'images.cache_read', { file: filePath, operation: 'redis' });
        return null;
    }
}

async function setRedisImage(filePath, version, file) {
    const images = cacheLists?.images;
    if (!images || Date.now() < redisUnavailableUntil) return;

    try {
        await images.set(filePath, version, file.toString('base64'));
    } catch (error) {
        redisUnavailableUntil = Date.now() + 30_000;
        reportError(error, 'images.cache_write', { file: filePath, operation: 'redis' });
    }
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function normalizeColor(color) {
    if (!color) return '#000000';
    return String(color).startsWith('#') || String(color).startsWith('rgb') ? String(color) : `#${color}`;
}

function transformAttribute(transform) {
    if (!transform.x && !transform.y && !transform.angle) return '';
    return ` transform="translate(${transform.x} ${transform.y}) rotate(${transform.angle})"`;
}

function imageMimeType(format) {
    if (format === 'jpeg') return 'image/jpeg';
    if (format === 'svg') return 'image/svg+xml';
    return `image/${format || 'png'}`;
}

function imageSvg(image, x, y, width, height, transform) {
    const source = image.data.toString('base64');
    return `<svg width="${transform.outputWidth}" height="${transform.outputHeight}" xmlns="http://www.w3.org/2000/svg"><image href="data:${imageMimeType(image.format)};base64,${source}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="none"${transformAttribute(transform)}/></svg>`;
}

class ImageComposer {
    constructor(width, height) {
        this.width = Math.round(width);
        this.height = Math.round(height);
        this.operations = [];
        this.state = {
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            lineCap: 'butt',
            x: 0,
            y: 0,
            angle: 0
        };
        this.states = [];
        this.path = null;
    }

    getContext() {
        return this;
    }

    save() {
        this.states.push({ ...this.state });
    }

    restore() {
        if (this.states.length) this.state = this.states.pop();
    }

    translate(x, y) {
        this.state.x += Number(x) || 0;
        this.state.y += Number(y) || 0;
    }

    rotate(radians) {
        this.state.angle += (Number(radians) || 0) * 180 / Math.PI;
    }

    drawImage(image, x, y, width = image.width, height = image.height) {
        this.operations.push({ type: 'image', image, x, y, width, height, transform: this.transform() });
    }

    fillRect(x, y, width, height) {
        this.operations.push({ type: 'rect', x, y, width, height, style: this.state.fillStyle, transform: this.transform() });
    }

    clearRect(x, y, width, height) {
        this.operations.push({ type: 'rect', x, y, width, height, style: { color: '#00000000' }, transform: this.transform(), blend: 'clear' });
    }

    beginPath() {
        this.path = null;
    }

    rect(x, y, width, height) {
        this.path = { type: 'rect', x, y, width, height };
    }

    moveTo(x, y) {
        this.path = { type: 'line', points: [[x, y]] };
    }

    lineTo(x, y) {
        if (!this.path) this.moveTo(x, y);
        else this.path.points.push([x, y]);
    }

    closePath() {}

    fill() {
        if (this.path?.type === 'rect') this.fillRect(this.path.x, this.path.y, this.path.width, this.path.height);
    }

    stroke() {
        if (this.path?.type === 'line') {
            this.operations.push({
                type: 'line',
                points: this.path.points,
                style: this.state.strokeStyle,
                lineWidth: this.state.lineWidth,
                lineCap: this.state.lineCap,
                transform: this.transform()
            });
        }
    }

    createLinearGradient(x1, y1, x2, y2) {
        return { type: 'gradient', x1, y1, x2, y2, stops: [] };
    }

    drawText(text, fontSize, fontPath, fontColor, x, y, align) {
        const font = opentype.loadSync(fontPath);
        const value = String(text ?? '');
        const textPath = font.getPath(value, 0, 0, Number(fontSize) || 10);
        const bounds = textPath.getBoundingBox();
        const width = bounds.x2 - bounds.x1;
        const height = bounds.y2 - bounds.y1;
        let left = Number(x) || 0;
        let top = Number(y) || 0;

        switch (Number(align) || 0) {
            case 1: left -= width / 2; break;
            case 2: left -= width; break;
            case 3: top -= height / 2; break;
            case 4: left -= width / 2; top -= height / 2; break;
            case 5: left -= width; top -= height / 2; break;
            case 6: top -= height; break;
            case 7: left -= width / 2; top -= height; break;
            case 8: left -= width; top -= height; break;
        }

        textPath.fill = normalizeColor(fontColor);
        this.operations.push({
            type: 'text',
            path: textPath.toPathData(2),
            x: left - bounds.x1,
            y: top - bounds.y1,
            style: normalizeColor(fontColor),
            transform: this.transform()
        });
    }

    transform() {
        return { x: this.state.x, y: this.state.y, angle: this.state.angle, outputWidth: this.width, outputHeight: this.height };
    }

    async toBuffer(format = 'png') {
        let output = await sharp({
            create: {
                width: this.width,
                height: this.height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        }).png(PNG_OPTIONS).toBuffer();

        const layers = [];
        for (const operation of this.operations) {
            const layer = await this.renderOperation(operation);
            if (layer) layers.push(layer);
        }

        if (layers.length) output = await sharp(output).composite(layers).png(PNG_OPTIONS).toBuffer();

        if (format === 'jpeg' || format === 'jpg') return sharp(output).jpeg().toBuffer();
        return output;
    }

    async renderOperation(operation) {
        const transform = operation.transform;
        if (operation.type === 'image') {
            const image = await imageFrom(operation.image);
            return { input: Buffer.from(imageSvg(image, operation.x, operation.y, operation.width, operation.height, transform)) };
        }

        if (operation.type === 'text') {
            return { input: Buffer.from(`<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg"><path d="${operation.path}" fill="${operation.style}" transform="translate(${operation.x} ${operation.y})${transformAttribute(transform)}"/></svg>`) };
        }

        if (operation.type === 'rect') {
            const style = operation.style;
            let fill = normalizeColor(style?.color || style);
            let gradient = '';
            if (style?.type === 'gradient') {
                const stops = style.stops.map(stop => `<stop offset="${stop.offset * 100}%" stop-color="${escapeXml(stop.color)}"/>`).join('');
                gradient = `<defs><linearGradient id="g" x1="${style.x1}" y1="${style.y1}" x2="${style.x2}" y2="${style.y2}" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs>`;
                fill = 'url(#g)';
            }
            return {
                input: Buffer.from(`<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">${gradient}<rect x="${operation.x}" y="${operation.y}" width="${operation.width}" height="${operation.height}" fill="${fill}"${transformAttribute(transform)}/></svg>`),
                blend: operation.blend || 'over'
            };
        }

        if (operation.type === 'line') {
            const points = operation.points.map(point => point.join(',')).join(' ');
            return {
                input: Buffer.from(`<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg"><polyline points="${points}" fill="none" stroke="${normalizeColor(operation.style)}" stroke-width="${operation.lineWidth}" stroke-linecap="${operation.lineCap}"${transformAttribute(transform)}/></svg>`)
            };
        }
    }
}

img.sharp = sharp;
img.SharpImage = SharpImage;
img.loadImage = loadImage;
img.createComposer = (width, height) => new ImageComposer(width, height);

async function preloadAssets() {
    const loadedSources = new Map();
    const loadAsset = (source) => {
        if (!loadedSources.has(source)) loadedSources.set(source, loadImage(source));
        return loadedSources.get(source);
    };

    await Promise.all(Object.entries(ASSET_GROUPS).map(async ([groupName, definitions]) => {
        const group = {};
        for (const [name, source] of Object.entries(definitions)) {
            group[name] = await loadAsset(source);
        }
        if (groupName === 'map') group.mark = await img.resize(group.mark, 250, 250);
        assetCache.set(groupName, group);
    }));
}

img.preloadAssets = function () {
    if (!assetsReady) assetsReady = preloadAssets();
    return assetsReady;
};

img.getAssets = async function (groupName) {
    await img.preloadAssets();
    return assetCache.get(groupName);
};

img.getAttachment = async function (image, name) {
    if (!image) return;
    return new Discord.AttachmentBuilder(await imageToBuffer(image), { name });
};

img.sendImage = async function (channel, image, interactionidreference, text) {
    if (!image) return;
    const attachment = await img.getAttachment(image, 'image.png');
    try {
        const container = new ContainerBuilder().addFileComponents(new FileBuilder().setURL('attachment://image.png'));
        if (text) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
        return await channel.send({ components: [container], flags: Discord.MessageFlags.IsComponentsV2, files: [attachment] });
    } catch (error) {
        await channel.send({
            components: [new TextDisplayBuilder().setContent('Um erro ocorreu ao tentar enviar a imagem!')],
            flags: Discord.MessageFlags.IsComponentsV2
        });
        clientService.current?.emit('error', error);
    }
};

img.resize = async function (image, width, height) {
    const source = await imageFrom(image);
    const data = await sharp(source.data).resize(Math.round(width), Math.round(height), { fit: 'fill' }).png(PNG_OPTIONS).toBuffer();
    return new SharpImage(data, Math.round(width), Math.round(height));
};

img.drawImage = async function (image, overlay, x, y) {
    const base = await imageFrom(image);
    const layer = await imageFrom(overlay);
    const data = await sharp(base.data).composite([{ input: layer.data, left: Math.round(x), top: Math.round(y) }]).png(PNG_OPTIONS).toBuffer();
    return new SharpImage(data, base.width, base.height);
};

img.drawText = function (context, ...args) {
    context.drawText(...args);
};

img.editBorder = async function (image, radius, circleinfo) {
    const source = await imageFrom(image);
    const shape = circleinfo && source.width === source.height
        ? `<circle cx="${source.width / 2}" cy="${source.height / 2}" r="${source.width / 2}" fill="white"/>`
        : `<rect width="${source.width}" height="${source.height}" rx="${radius}" fill="white"/>`;
    const mask = Buffer.from(`<svg width="${source.width}" height="${source.height}" xmlns="http://www.w3.org/2000/svg">${shape}</svg>`);
    const data = await sharp(source.data).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png(PNG_OPTIONS).toBuffer();
    return new SharpImage(data, source.width, source.height);
};

img.createImage = async function (width, height, color, type) {
    const composer = img.createComposer(width, height);
    const context = composer.getContext('2d');
    if (type === 1) {
        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgb(197, 0, 0)');
        gradient.addColorStop(1, 'rgb(129, 28, 237)');
        context.fillStyle = gradient;
    } else {
        context.fillStyle = normalizeColor(color);
    }
    context.fillRect(0, 0, width, height);
    return new SharpImage(await composer.toBuffer(), width, height);
};

img.generateProgressBar = async function (type, width, height, percent, lineWidth, lineCap, color) {
    const outputWidth = type === 0 ? width : height;
    const outputHeight = height;
    const stroke = normalizeColor(color);
    const cap = lineCap === 1 ? 'round' : 'square';
    let shape;

    if (type === 0) {
        shape = `<line x1="0" y1="${height / 2}" x2="${width * percent / 100}" y2="${height / 2}"/>`;
    } else {
        const center = height / 2;
        const radius = width;
        const angle = Math.max(0, Math.min(100, percent)) / 100 * Math.PI * 2;
        const startX = center + radius * Math.cos(-Math.PI / 2);
        const startY = center + radius * Math.sin(-Math.PI / 2);
        const endX = center + radius * Math.cos(-Math.PI / 2 + angle);
        const endY = center + radius * Math.sin(-Math.PI / 2 + angle);
        const largeArc = angle > Math.PI ? 1 : 0;
        shape = percent >= 100
            ? `<circle cx="${center}" cy="${center}" r="${radius}"/>`
            : `<path d="M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}"/>`;
    }

    const svg = Buffer.from(`<svg width="${outputWidth}" height="${outputHeight}" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="${stroke}" stroke-width="${lineWidth}" stroke-linecap="${cap}">${shape}</g></svg>`);
    const data = await sharp(svg).png(PNG_OPTIONS).toBuffer();
    return new SharpImage(data, outputWidth, outputHeight);
};

img.rotate = async function (image, degrees) {
    const source = await imageFrom(image);
    const data = await sharp(source.data).rotate(degrees, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png(PNG_OPTIONS).toBuffer();
    const metadata = await sharp(data).metadata();
    return new SharpImage(data, metadata.width, metadata.height);
};

async function imageToBuffer(image) {
    if (image instanceof ImageComposer) return image.toBuffer();
    if (image instanceof SharpImage) return image.data;
    if (Buffer.isBuffer(image)) return image;
    return readSource(image);
}

// `fillStyle` and gradient stops intentionally stay on the compositor context,
// matching the small subset of the 2D services used by the image generators.
Object.defineProperties(ImageComposer.prototype, {
    fillStyle: { get() { return this.state.fillStyle; }, set(value) { this.state.fillStyle = value; } },
    strokeStyle: { get() { return this.state.strokeStyle; }, set(value) { this.state.strokeStyle = value; } },
    lineWidth: { get() { return this.state.lineWidth; }, set(value) { this.state.lineWidth = value; } },
    lineCap: { get() { return this.state.lineCap; }, set(value) { this.state.lineCap = value; } }
});

const originalCreateLinearGradient = ImageComposer.prototype.createLinearGradient;
ImageComposer.prototype.createLinearGradient = function (...args) {
    const gradient = originalCreateLinearGradient.apply(this, args);
    gradient.addColorStop = (offset, color) => gradient.stops.push({ offset, color });
    return gradient;
};

img.imagegens = new Discord.Collection(undefined, undefined);
fs.readdir(path.resolve(__dirname, '../packages/imagegens/'), (error, files) => {
    if (error) return reportError(error, 'images.generators_load');
    files.filter(file => file.endsWith('.js')).forEach(file => {
        const generator = require(`../packages/imagegens/${file}`);
        img.imagegens.set(file, (options) => generator({ Discord, cacheLists, client: clientService.current, db }, options));
    });
});
console.log('[GENIMAGES] Carregados'.green);

}
}

module.exports = new ImagesService();
