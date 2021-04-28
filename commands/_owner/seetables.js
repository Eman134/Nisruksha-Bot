module.exports = {
    name: 'seetables',
    aliases: ['vertables', 'seetabelas', 'seecolumns', 'vercolunas'],
    category: 'none',
    description: 'Liste as tabelas e colunas do banco de dados',
	async execute(API, msg) {
        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        let args = API.args(msg)

        let istring = "```js\n"
        let middle = ""
        let fstring = "```"

        if (args.length != 0) {
            
            let res = await API.db.pool.query(`SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '${args[0]}');`);

            if (!res.rows[0].exists) {
                return msg.quote('Essa tabela não existe! Utilize `'+API.prefix+'seetables`')
            }


            let res2 = await API.db.pool.query(`SELECT * FROM information_schema.columns WHERE table_schema = 'public' AND table_name   = '${args[0]}';`);
        
            for (xi = 0; xi < res2.rows.length; xi++) {

                middle += "|--" + res2.rows[xi].column_name + "\n"

            }
            await msg.quote(istring + middle.slice(0, 1980) + fstring)
            return
        }

        let res = await API.db.pool.query(`SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`);
        
        let tables = res.rows
        
        for (i = 0; i < tables.length; i++) {
            middle += "|-" + tables[i].tablename + "\n"


        }

        await msg.quote(istring + middle.slice(0, 1980) + fstring)

	}
};