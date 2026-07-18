export class SQLValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SQLValidationError";
  }
}
// const MAX_SQL_LENGTH = 50000;

const BLOCKED = [

    "ATTACH",

    "DETACH",

    "LOAD_EXTENSION",

    "VACUUM",

    "ANALYZE",

    "REINDEX",

    "CREATE TRIGGER",

    "CREATE TEMP TRIGGER",

    "CREATE VIRTUAL TABLE"

];
export function validateSQL(sql:string){

    if(!sql.trim()){

        throw new SQLValidationError(

            "SQL cannot be empty."

        );

    }

    // if(sql.length>MAX_SQL_LENGTH){

    //     throw new SQLValidationError(

    //         "SQL too large."

    //     );

    // }

    const upper=sql.toUpperCase();

    for(const keyword of BLOCKED){

        if(upper.includes(keyword)){

            throw new SQLValidationError(

                `${keyword} is not allowed.`

            );

        }

    }

}
export function validateTemplate(sql:string){

    if(!sql.includes("CREATE TABLE")){

        throw new SQLValidationError(

            "Template must create tables."

        );

    }

}