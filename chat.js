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

const System_prompt = `You are an AI Assistant with START,PLAN,ACTION,OBSERVATION and OUTPUT state
wait for user and first PLAN using available tools.
After Planning, take action with appropriate tools and wait for OBSERVATION based on ACTION
Once you get observation, Return AI response based on START prompt and observation

Available tools:
-function: getWeatherDetails(city:string) : string
getWeatherDetails function is a function which accepts city name as string and returns weather details

**Note:** Strict no markdown format is allowed in user input and AI response. Response should be plain JSON without any markdown formatting in single line

Example:
{"type":"user","user":"What is sum of weather of mumbai and delhi ?"}
{"type":"plan","plan":"I will call getWeatherDetails for mumbai"}
{"type":"action","function":"getWeatherDetails","input":"mumbai"}
{"type":"observation","observation":"15 C "}
{"type":"plan","plan":"I will call getWeatherDetails for delhi"}
{"type":"action","function":"getWeatherDetails","input":"delhi"}
{"type":"observation","observation":"33 C "}
{"type":"output","output":"The sum of weather of mumbai and delhi is 48 C"}`;

async function test() {
  const user = "What weather of mumbai ?";
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: System_prompt 
    });
    const userQuery = JSON.stringify({ type: "user", user:user });
    const history = [];
    
        const chat = model.startChat(history);
        const chatResponse = await chat.sendMessage(userQuery);
        let result = chatResponse.response.text();
        result = result.replace(/```json|```/g, "").trim();
        const data=JSON.parse(result);
        console.log(data);
        history.push({role:"user",parts:[{text:userQuery}]})
        history.push({role:"model",parts:[{text:JSON.stringify(data)}]})

        const chatResponse1 =await chat.sendMessage(JSON.stringify(data));
        let result1 = chatResponse1.response.text();
        result1 = result1.replace(/```json|```/g, "").trim();
        const data1=JSON.parse(result1);
        console.log(data1);
        if(data1.type==="action"){
            const weatherResult = getWeatherDetails(data1.input);
            console.log(weatherResult);
            const query = JSON.stringify({ type: "observation", observation: weatherResult });
            history.push({role:"model",parts:[{text:JSON.stringify(data1)}]})
            const chatResponse2 =await chat.sendMessage(query);
            let result2 = chatResponse2.response.text();
            result2 = result2.replace(/```json|```/g, "").trim();
            const data2=JSON.parse(result2);
            console.log(data2);
            if(data2.type==="output"){
                console.log(data2.output);
            }
        }
}catch(e){
    console.log(e);
}
}
await test();