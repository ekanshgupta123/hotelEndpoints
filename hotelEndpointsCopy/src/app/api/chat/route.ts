import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

require('dotenv').config({ path: "/Users/ekanshgupta/testHotel/hotelEndpoints/src/app/api/backend/.env" })

type Groupings = {
    groups: string[], // try here
};

export async function POST(req: Request) {
  try {
    const names = await req.json();
    
    const model = new ChatOpenAI({
      model: "gpt-3.5-turbo",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    const formatInstructions = `Respond only in valid JSON. The JSON object you return should match the following schema:
    {{ groups: [ [ "string" ] ] }}

    Where groups is an array of arrays which contain strings of hotel rooms whose room type (i.e. Classic, Standard, Premium, Deluxe, etc.) and size (i.e. Room, Double Room, Quadruple Room, etc.) are exactly the same, 
    not accounting for any additional features (oftentimes indicated by parentheses). For instance, 'Premium Double Room (...)' and 'Premium Room' belong in distinct groups. 
    Typically, the words up to and including the word 'room' are a good indication of the overall type, but that may not always be the case for other select room types (ex. dorm, hostel, etc.). 
    The strings that are returned should be the same as those in the original query. 
    `;

    const parser = new JsonOutputParser<Groupings>();
    const prompt = await ChatPromptTemplate.fromMessages([
        [
          "system",
          "Answer the user query. Wrap the output in `json` tags\n{format_instructions}",
        ],
        ["human", "{query}"],
      ]).partial({
        format_instructions: formatInstructions,
      });

    const query = `Here are the list of hotel room names: ${names.join(', ')}. Give me a logical grouping of the hotel room names based on the room type. `;
    console.log((await prompt.format({ query })).toString());
    
    const chain = prompt.pipe(model).pipe(parser);
    const answer = await chain.invoke({ query });
    return NextResponse.json({ answer });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e });
  };
};