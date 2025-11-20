import { DurableObject } from "cloudflare:workers";

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/**
 * Env provides a mechanism to reference bindings declared in wrangler.jsonc within JavaScript
 *
 * @typedef {Object} Env
 * @property {DurableObjectNamespace} MY_DURABLE_OBJECT - The Durable Object namespace binding
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param {DurableObjectState} ctx - The interface for interacting with Durable Object state
	 * @param {Env} env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx, env) {
		super(ctx, env);
		this.state = ctx;
    	this.env = env;
	}

	async fetch(request){
		const data = await request.json();
		const probNum = data.probNum;
		const mode = data.mode;
		let modes = (await this.state.storage.get("modes")) || {
			get_started: [],
			edge_case: [],
			optimize: []
    	};
		modes[mode].push(probNum)

		await this.state.storage.put("modes",modes);
		console.log("Stored modes:", modes);
		return Response.json(modes)

	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param {Request} request - The request submitted to the Worker from the client
	 * @param {Env} env - The interface to reference bindings declared in wrangler.jsonc
	 * @param {ExecutionContext} ctx - The execution context of the Worker
	 * @returns {Promise<Response>} The response to be sent back to the client
	 */
	async fetch(request, env, ctx) {
		// my code
		const requestData = await request.json();
		const prompt = requestData.prompt ;
		const mode = requestData.mode;
		const probNum = requestData.probNum;
		const solution = requestData.code;
		const userId = requestData.userId;

		const id = env.MY_DURABLE_OBJECT.idFromName(userId);
    	const userDo = env.MY_DURABLE_OBJECT.get(id);
		// need to pass as a request object
		const prevCalls = await userDo.fetch(  
			new Request("https://url", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestData)
				})
		);
		const userModes = await prevCalls.json();
		let previousStruggles = "Here is a list of problems the user as ask about and which mode they selected for each problem, use this as context for what they have trouble with on certain patterns or problem types\n"
		for (const [modeKey, problems] of Object.entries(userModes)) {
			previousStruggles += `${modeKey}: ${problems.join(", ")}\n`;
		}



		const modePrompts = {
			"get_started": `
			You are a coding professor, you will guide this programmer on how to get started on their coding problem. 
			Supply them with patterns for them to consider using like common algorithms used in these sorts of problems.
			You will NOT give them the solution to this problem, they need to learn to reach the solution themselves.
			Please suggest simplier leetcode probelms the student could try and master before returning to this problem in the future.
			`,
			"edge_case": `
			You are a coding professor, you will guide this programmer on how to account for edge cases on their coding problem based on the solution they provide.
			You will suggest parts of their code that need to be addressed and point them in the direction of how they may need to rethinbk their implementation.
			you wil NOT give them the solution to this problem, they need to learn to reach the solution themselves.
			`,
			"optimize": `
			You are a coding professor, you will guide this programmer on how to optimize their already working solution based on the coding problem provided.
			Please do a runtime aynalsis of the solution provided and tell the user what it is as well as what the expected solutions runtime would be.
			If the user is using the proper algorithm to solve the problem let them know this and give them hints as to what is slowing down their solution.
			If the user is using the improper algorithm to solve this problem suggest hints on how they may go about the problem differently comapred to what they have done.
			`,
		};
		const problem = "We are discussing leetcode problem number: " + probNum;
		const userPrompt = "Inital thought process: " + prompt + "\n current attemped solution:\n" + solution;
		
		const mode_selected = modePrompts[mode];
		// need to add a system prompt that is the number of the problem so the model has that as key context
		const sendData = {
			messages: [
				{role:"system", content: previousStruggles},
				{role:"system", content: problem},
				{role:"system", content: mode_selected},
				{role:"user", content: userPrompt}
			],
			max_tokens: 2048
		};

		const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", sendData)
		console.log("AI full response:", aiResponse);
		const retVal = aiResponse.response
		return Response.json({message: retVal})
	},
};
