"use client";
import DatabaseSelector from "@/components/sql_playground/DatabaseSelector";
import { redirect } from 'next/navigation';
export default function App() {

    return (
      <>
        <DatabaseSelector
          onConnect={(conn) => {redirect(`/sql_playground/${conn}`)}}
        />
      </>
    );
}