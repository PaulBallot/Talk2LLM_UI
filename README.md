# Talk2LLM_UI: A qualtrics-based plug-and-play experiment on Human-LLM interaction

DebateLLM is a Qualtrics-based experimental paradigm for interactions with state-of-the-art LLMs. It requires little to no coding experience while allowing  for a wide variety of different experimental setups.

## Setup
DebateLLM includes a [plug-and-play QSF file](www.downloadlink.com) that can be imported directly into Qualtrics. 
1. To import the downloaded file, please see [the official Qualtrics Documentation](https://www.qualtrics.com/support/survey-platform/survey-module/survey-tools/import-and-export-surveys/). 
2. Setup the API Key
- Register to [Openrouter](https://openrouter.ai/). 
- Aquire credits (e.g., 25$). 
- Create an API key. 
- For security reasons, please make sure to set a reasonable limit for the API Key. DO NOT SKIP THIS STEP!
- After setting the limit, copy the API code, go to the Qualtrics survey flow and past the key in the embedded data field "OpenRouterAPIKey".

## Usage
After following the steps outlined above the experiment is ready to use. However, multiple customization options are available, including the model, response prompts, evaluation prompts or the order of interaction. Please see the documentation for this. 


## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
