import dog1 from "@/assets/dog-1.jpg";
import dog2 from "@/assets/dog-2.jpg";
import dog3 from "@/assets/dog-3.jpg";
import cat1 from "@/assets/cat-1.jpg";
import cat2 from "@/assets/cat-2.jpg";
import cat3 from "@/assets/cat-3.jpg";

export type Species = "dog" | "cat";
export type Gender = "male" | "female";

export type Pet = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  age: string;
  gender: Gender;
  nature: string;
  rescuedFrom: string;
  registrationNo?: string;
  vaccinated: boolean;
  sterilized: boolean;
  image: string;
};

export const PETS: Pet[] = [
  {
    id: "d1",
    name: "Sheru",
    species: "dog",
    breed: "Indian Pariah",
    age: "3 years",
    gender: "male",
    nature: "Gentle, loves long walks and playing fetch. Very friendly with children and other dogs.",
    rescuedFrom: "Found injured near Hingna Road, Nagpur",
    registrationNo: "RT-D-001",
    vaccinated: true,
    sterilized: true,
    image: dog1,
  },
  {
    id: "d2",
    name: "Bunty",
    species: "dog",
    breed: "Mixed Breed (Labrador cross)",
    age: "4 months",
    gender: "male",
    nature: "Playful puppy, learning fast. Loves to chew toys and nap in laps.",
    rescuedFrom: "Abandoned near Manish Nagar bus stop, Nagpur",
    registrationNo: "RT-D-002",
    vaccinated: true,
    sterilized: false,
    image: dog2,
  },
  {
    id: "d3",
    name: "Santro",
    species: "dog",
    breed: "Indian Spitz",
    age: "9 years",
    gender: "female",
    nature: "Calm senior, couch expert. Loves belly rubs and quiet evenings.",
    rescuedFrom: "Owner surrender — family relocated abroad, Dharampeth, Nagpur",
    registrationNo: "RT-D-003",
    vaccinated: true,
    sterilized: true,
    image: dog3,
  },
  {
    id: "c1",
    name: "Misti",
    species: "cat",
    breed: "Indian Domestic Shorthair",
    age: "2 years",
    gender: "female",
    nature: "Sun-chaser and lap cat. Purrs constantly and loves warm blankets.",
    rescuedFrom: "Found on rooftop in Sadar, Nagpur — malnourished",
    registrationNo: "RT-C-001",
    vaccinated: true,
    sterilized: true,
    image: cat1,
  },
  {
    id: "c2",
    name: "Mau",
    species: "cat",
    breed: "Persian Mix",
    age: "10 weeks",
    gender: "male",
    nature: "Tiny, curious, cuddly. Loves exploring and chasing feather toys.",
    rescuedFrom: "Rescued from a drain near Medical Square, Nagpur",
    registrationNo: "RT-C-002",
    vaccinated: true,
    sterilized: false,
    image: cat2,
  },
  {
    id: "c3",
    name: "Veera",
    species: "cat",
    breed: "Tuxedo (Indian Domestic)",
    age: "5 years",
    gender: "male",
    nature: "Quiet gentleman. Independent but affectionate once he trusts you.",
    rescuedFrom: "Street rescue from Sitabuldi Market area, Nagpur",
    registrationNo: "RT-C-003",
    vaccinated: true,
    sterilized: true,
    image: cat3,
  },
];

export const EMERGENCY_PHONE = "+91 98765 43210";
