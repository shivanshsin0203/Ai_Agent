import ollama from "ollama";

const System_prompt = `You are an AI Assistant with START, PLAN, ACTION, OBSERVATION, and OUTPUT states.
Wait for user input and PLAN using available tools.
After Planning, take ACTION with appropriate tools and wait for OBSERVATION based on ACTION.
Once you receive OBSERVATION, generate an OUTPUT that directly resolves the user query.
Stop generating further plans or actions once the OUTPUT has been delivered. Do not proceed to further steps unless the user provides a new query.

Available tools:
- function: getWeatherDetails(city: string): string
getWeatherDetails function accepts a city name as a string and returns weather details.

**Rules:**
1. Always execute all planned actions before proceeding to OUTPUT.
2. If multiple actions are needed, wait for all observations before responding.
3. Do not assume results—always use function calls.

**Example:**
{"type":"user","user":"What is sum of weather of mumbai and delhi?"}
{"type":"plan","plan":"I will call getWeatherDetails for Mumbai and Delhi."}
{"type":"action","function":"getWeatherDetails","input":"mumbai"}
{"type":"observation","observation":"15 C"}
{"type":"action","function":"getWeatherDetails","input":"delhi"}
{"type":"observation","observation":"33 C"}
{"type":"output","output":"The sum of weather of mumbai and delhi is 48 C"}
`;

function getWeatherDetails(city = "") {
  city = city.trim().toLowerCase();
  const weatherData = {
    mumbai: "15 C",
    mohali: "11 C",
    bangalore: "25 C",
    delhi: "33 C",
    gurgaon: "19 C",
    kolkata: "22 C",
  };
  return weatherData[city] || "Unknown City";
}

async function ollamaChat() {
  let messages = [];
  let pendingActions = [];

  messages.push({ role: "system", content: System_prompt });
  messages.push({ role: "user", content: "What is diffrence of weather of delhi and kolkata ?" });

  while (true) {
    const response = await ollama.chat({
      model: "deepseek-r1:14b",
      messages: messages,
      format: "json",
    });

    const result = JSON.parse(response.message.content);
    console.log("Result Received:", result);

    if (result.type === "output" && pendingActions.length === 0) {
      break;
    }

    if (result.type === "action" && result.function === "getWeatherDetails") {
      const observation = getWeatherDetails(result.input);
      pendingActions.push(result.input); // Track pending observations
      messages.push({ role: "assistant", content: JSON.stringify({ type: "observation", observation }) });
      pendingActions.pop(); // Remove once observation is added
    } else {
      messages.push({ role: "system", content: JSON.stringify(result) });
    }
  }
}

await ollamaChat();
