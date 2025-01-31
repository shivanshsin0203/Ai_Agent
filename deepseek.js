import ollama from "ollama";

const System_prompt = `You are an AI Assistant with START, PLAN, ACTION, OBSERVATION, and OUTPUT states.
Wait for user input and PLAN using available tools.
After Planning, take ACTION with appropriate tools and wait for OBSERVATION based on ACTION.
Once you receive OBSERVATION, generate an OUTPUT that directly resolves the user query.
Stop generating further plans or actions once the OUTPUT has been delivered. Do not proceed to further steps unless the user provides a new query.

Available tools:
- function: getWeatherDetails(city: string): string
getWeatherDetails function accepts a city name as a string and returns weather details.

**Note:** Strictly return plain JSON without any markdown formatting in a single line.
Strictly Give one JSON response at a time and wait for user input before generating the next response.
Example 1:
{"type":"user","user":"What is the weather of Mumbai?"}
{"type":"plan","plan":"I will call getWeatherDetails for Mumbai"}
{"type":"action","function":"getWeatherDetails","input":"Mumbai"}
{"type":"observation","observation":"15 C"}
{"type":"output","output":"The weather in Mumbai is 15 C."}
Example 2:
{"type":"user","user":"What is sum of weather of mumbai and delhi ?"}
{"type":"plan","plan":"I will call getWeatherDetails for mumbai"}
{"type":"action","function":"getWeatherDetails","input":"mumbai"}
{"type":"observation","observation":"15 C "}
{"type":"plan","plan":"I will call getWeatherDetails for delhi"}
{"type":"action","function":"getWeatherDetails","input":"delhi"}
{"type":"observation","observation":"33 C "}
{"type":"output","output":"The sum of weather of mumbai and delhi is 48 C"}
`;

function getWeatherDetails(city = "") {
  if (city.toLowerCase() === "mumbai") return "15 C";
  if (city.toLowerCase() === "mohali") return "11 C";
  if (city.toLowerCase() === "banglore") return "25 C";
  if (city.toLowerCase() === "delhi") return "33 C";
  if (city.toLowerCase() === "gurgoan") return "19 C";
  if (city.toLowerCase() === "kolkata") return "22 C";
}

async function ollamaChat() {
  let messages = [];
  messages.push({ role: "system", content: System_prompt });
  messages.push({ role: "user", content: "What is sum of weather of delhi and kolkata ?" });
  while (true) {
    console.log("This until this point"+messages);
    const response = await ollama.chat({
      model: "deepseek-r1:14b",
      messages: messages,
      format: "json",
    });
    const result = JSON.parse(response.message.content);
    console.log(result);
    if(result.type === "output") {
      break;
    }
    if (result.type === "action" && result.function === "getWeatherDetails") {
        const observation = getWeatherDetails(result.input);
         // Store temperature for summing
        messages.push({ role: "assistant", content: JSON.stringify({ type: "observation", observation }) });
    }else{
        const query=JSON.stringify(result);
        messages.push({ role: "system", content: query });
    }
  }
}
await ollamaChat();
