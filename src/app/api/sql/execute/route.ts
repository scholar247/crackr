import { NextRequest, NextResponse } from "next/server";
import { executeSQL } from "@/lib/sql/sqlExecutor";

interface ExecuteBody {
    template: string;
    sql: string;
}

export async function POST(req: NextRequest) {

    try {

        const body = await req.json() as Partial<ExecuteBody>;

        if (!body.template) {

            return NextResponse.json({

                status: false,

                executionTime: 0,

                error: "Template is required."

            }, {

                status: 400

            });

        }

        if (!body.sql) {

            return NextResponse.json({

                status: false,

                executionTime: 0,

                error: "SQL is required."

            }, {

                status: 400

            });

        }

        const result = await executeSQL({

            template: body.template,

            sql: body.sql

        });

        return NextResponse.json(result);

    }

    catch (err: any) {

        return NextResponse.json({

            status: false,

            executionTime: 0,

            error: err.message ?? "Unknown Error"

        }, {

            status: 500

        });

    }

}