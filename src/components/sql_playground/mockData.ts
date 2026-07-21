import type { HistoryItem, DbConnection } from "@/types/sql_play";
export const SEED_CONNECTIONS: DbConnection[] = [
    {
    id: "blank",
    name: "New Blank Database",
    template: "blank",
    engine: "sqlite",
  },
  {
    id: "airway",
    name: "Airways Database",
    template: "airway",
    engine: "sqlite",
  },
  {
    id: "college",
    name: "College Database",
    template: "college",
    engine: "sqlite",
  },
  {
    id: "library",
    name: "Library Database",
    template: "librarysystem",
    engine: "sqlite",
  },
    {
    id: "northwind",
    name: "Northwind Database",
    template: "northwind",
    engine: "sqlite",
  },
    {
    id: "company",
    name: "Company Database",
    template: "company",
    engine: "sqlite",
  },
    {
    id: "studentportal",
    name: "Studentportal Database",
    template: "studentportal",
    engine: "sqlite",
  },
     {
    id: "banking",
    name: "Banking Database",
    template: "banking",
    engine: "sqlite",
  },
     {
    id: "ecommerce",
    name: "Ecommerce Database",
    template: "ecommerce",
    engine: "sqlite",
  },
     {
    id: "hospital",
    name: "Hospital Database",
    template: "hospital",
    engine: "sqlite",
  },
     {
    id: "hotel_management",
    name: "Hotel management Database",
    template: "hotel_management",
    engine: "sqlite",
  },
     {
    id: "hr_management",
    name: "HR Management Database",
    template: "hr_management",
    engine: "sqlite",
  },
     {
    id: "movie_booking",
    name: "Movie Booking Database",
    template: "movie_booking",
    engine: "sqlite",
  },
     {
    id: "social_media",
    name: "Social Media Database",
    template: "social_media",
    engine: "sqlite",
  },
       {
    id: "university",
    name: "University Database",
    template: "university",
    engine: "sqlite",
  },
];

export const INITIAL_HISTORY: HistoryItem[] = [];

export const DEFAULT_QUERY = `-- Welcome to SQL Playground · Scholar247
-- You can write your SQL queries here`;
