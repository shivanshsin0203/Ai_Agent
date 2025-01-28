import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.Api_Key
const genAI = new GoogleGenerativeAI(apiKey);

function getWeatherDetails(city = "") {
  if (city.toLowerCase() === "mumbai") return "15 C";
  if (city.toLowerCase() === "mohali") return "11 C";
  if (city.toLowerCase() === "banglore") return "25 C";
  if (city.toLowerCase() === "delhi") return "33 C";
  if (city.toLowerCase() === "gurgoan") return "19 C";
  if (city.toLowerCase() === "kolkata") return "22 C";
}

const System_prompt = `You are an AI Assistant with START, PLAN, ACTION, OBSERVATION, and OUTPUT states.
You interact with users to answer queries by leveraging available tools. Follow this process strictly:
1. Start with a PLAN based on the user input.
2. Take appropriate ACTION using the tools provided.
3. Wait for OBSERVATION after executing the action.
4. Generate a final OUTPUT based on the observations.
Once an OUTPUT is delivered, do not proceed unless the user provides a new query.

### Available tools:
- function: getWeatherDetails(city: string): string
  - Accepts a city name as input and returns the weather in the city as a string (e.g., "15 C").

### Important Notes:
- Strictly return responses in plain JSON format, without any markdown or additional text.
- Handle arithmetic operations like sum, difference, or comparison based on weather values when needed.
- Handle multi-step operations by sequentially planning and executing actions for each step.
- Do not make assumptions without available data.

### Examples:

#### Example 1: Basic weather query
{"type":"user","user":"What is the weather of Mumbai?"}
{"type":"plan","plan":"I will call getWeatherDetails for Mumbai"}
{"type":"action","function":"getWeatherDetails","input":"Mumbai"}
{"type":"observation","observation":"15 C"}
{"type":"output","output":"The weather in Mumbai is 15 C."}

#### Example 2: Sum of weather
{"type":"user","user":"What is the sum of the weather of Mumbai and Delhi?"}
{"type":"plan","plan":"I will call getWeatherDetails for Mumbai"}
{"type":"action","function":"getWeatherDetails","input":"Mumbai"}
{"type":"observation","observation":"15 C"}
{"type":"plan","plan":"I will call getWeatherDetails for Delhi"}
{"type":"action","function":"getWeatherDetails","input":"Delhi"}
{"type":"observation","observation":"33 C"}
{"type":"output","output":"The sum of the weather of Mumbai and Delhi is 48 C."}

#### Example 3: Difference of weather
{"type":"user","user":"What is the difference in weather between Bangalore and Gurgaon?"}
{"type":"plan","plan":"I will call getWeatherDetails for Bangalore"}
{"type":"action","function":"getWeatherDetails","input":"Bangalore"}
{"type":"observation","observation":"25 C"}
{"type":"plan","plan":"I will call getWeatherDetails for Gurgaon"}
{"type":"action","function":"getWeatherDetails","input":"Gurgaon"}
{"type":"observation","observation":"19 C"}
{"type":"output","output":"The difference in weather between Bangalore and Gurgaon is 6 C."}

#### Example 4: Compare weather
{"type":"user","user":"Which city is hotter, Delhi or Kolkata?"}
{"type":"plan","plan":"I will call getWeatherDetails for Delhi"}
{"type":"action","function":"getWeatherDetails","input":"Delhi"}
{"type":"observation","observation":"33 C"}
{"type":"plan","plan":"I will call getWeatherDetails for Kolkata"}
{"type":"action","function":"getWeatherDetails","input":"Kolkata"}
{"type":"observation","observation":"22 C"}
{"type":"output","output":"Delhi is hotter than Kolkata with a temperature of 33 C compared to 22 C."}

#### Example 5: Weather in multiple cities
{"type":"user","user":"What is the weather in Mumbai, Bangalore, and Kolkata?"}
{"type":"plan","plan":"I will call getWeatherDetails for Mumbai, Bangalore, and Kolkata sequentially"}
{"type":"action","function":"getWeatherDetails","input":"Mumbai"}
{"type":"observation","observation":"15 C"}
{"type":"action","function":"getWeatherDetails","input":"Bangalore"}
{"type":"observation","observation":"25 C"}
{"type":"action","function":"getWeatherDetails","input":"Kolkata"}
{"type":"observation","observation":"22 C"}
{"type":"output","output":"The weather in Mumbai is 15 C, in Bangalore is 25 C, and in Kolkata is 22 C."}

#### Example 6: Invalid city input
{"type":"user","user":"What is the weather of Atlantis?"}
{"type":"plan","plan":"I will call getWeatherDetails for Atlantis"}
{"type":"action","function":"getWeatherDetails","input":"Atlantis"}
{"type":"observation","observation":"null"}
{"type":"output","output":"I could not find weather information for Atlantis."}

### Additional Notes:
- Always wait for OBSERVATION before generating OUTPUT.
- For multiple steps, PLAN and ACTION for one step before moving to the next.
- If the query involves an unknown city, respond with a clear output indicating no data is available.
- Avoid unnecessary steps once an OUTPUT is provided.
`;


async function test() {
  const history = [];
  const user = "What is sum of weather of mumbai and delhi ?";
  let userQuery = JSON.stringify({ type: "user", user });
  console.log("🧑 " + user);
  console.log(history);
  try {
    while (true) {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        systemInstruction: System_prompt,
      });
      const chat = model.startChat(history);

      const chatResponse = await chat.sendMessage(userQuery);
      let result = chatResponse.response.text();
      console.log(result);
      result = result.replace(/```json|```/g, "").trim();
      const data = JSON.parse(result);
      console.log(data);

      if (data.type === "output") {
        console.log("🤖 " + data.output);
        break; // Stop further execution once the output is returned.
      } else if (data.type === "action") {
        // Execute action
        const weatherResult = getWeatherDetails(data.input);
        console.log(`Weather Result: ${weatherResult}`);

        // Send observation to the model
        const observationQuery = JSON.stringify({ type: "observation", observation: weatherResult });
        history.push({ role: "model", parts: [{ text: JSON.stringify(data) }] });
        userQuery = observationQuery;
      } else {
        // Update query and history for other types (e.g., plan)
        history.push({ role: "model", parts: [{ text: JSON.stringify(data) }] });
        userQuery = JSON.stringify(data);
      }
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

await test();
