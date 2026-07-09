Qualtrics.SurveyEngine.addOnload(function()
{
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("user-input");
  const article = document.getElementById("article-input");
  const sendButton = document.getElementById("send-button");
  const resetButton = document.getElementById("Reset-button");
  const submitButton = document.getElementById("submit-button");
  const start = Date.now();
  const url = "https://openrouter.ai/api/v1/chat/completions";
  var ResetCounter = 0;
  var canPlaySound = true;
  let historiesArray = [];
  var UserMessageCount = 0;
  var checkRequirementsResults = false; 

  var systemMessage = Qualtrics.SurveyEngine.getEmbeddedData('SystemPrompt');
  const apiKey = Qualtrics.SurveyEngine.getEmbeddedData('OpenRouterAPIKey'); // OpenRouter key
  const OR_model = Qualtrics.SurveyEngine.getEmbeddedData('setModel'); // seleced Model from https://openrouter.ai/models (click on the model and copy the Model Identifier)
  var conversationHistory = [{"role": "system", "content": systemMessage},];

  // Requirements
  var minimumInteractionCount = Qualtrics.SurveyEngine.getEmbeddedData('minimumInteractionCount');
  var minimumInteractionTime = Qualtrics.SurveyEngine.getEmbeddedData('minimumInteractionTime_seconds');
  var ArticleMinimumLength = Qualtrics.SurveyEngine.getEmbeddedData('ArticleMinimumLength');
  
  // Evaluation
  var EvaluationNecessary = Qualtrics.SurveyEngine.getEmbeddedData('EvaluationNecessary');
  if (EvaluationNecessary == 1) {
    var EvaluationPrompt = Qualtrics.SurveyEngine.getEmbeddedData('EvaluationPrompt');
  }

  // Does the LLM initiate the interaction?
  var LLMinitiates = Qualtrics.SurveyEngine.getEmbeddedData('LLMinitiates'); // 1: Yes; 0: No
   if (LLMinitiates == 1) {
    var LLMinitiates_StartPrompt = Qualtrics.SurveyEngine.getEmbeddedData('LLMinitiates_StartPrompt'); // The LLM needs "user input" to initiate. Provide the first message the LLM should react to. 
    var LLMinitiates_Visible = Qualtrics.SurveyEngine.getEmbeddedData('LLMinitiates_Visible'); // Should LLMinitiates_StartPrompt be visible to the User?
    var LLMinitiates_RepeatOnReset = Qualtrics.SurveyEngine.getEmbeddedData('LLMinitiates_RepeatOnReset'); // Should the Model initiate again after reset?
   }

this.hideNextButton();


  /**
 * Change button style when requirements are met
 */
function ColourChangeWhenRequirementsMet() {
let ms = Date.now() - start;
if (ms > (minimumInteractionTime*1000) && UserMessageCount >= minimumInteractionCount) {
  submitButton.style.background='#0B6DE0';
}}
setInterval(ColourChangeWhenRequirementsMet, 1000); 

/**
 * Transforms markdown into HTML formatting
 * @param  {string} text the text to be transformed
 * @return {string}      the transformed text
 */
  function parseMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background-color: #f1f1f1; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #1976d2; text-decoration: none;">$1</a>')
      .replace(/^### (.*$)/gm, '<h3 style="margin: 10px 0 5px 0; font-size: 16px;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="margin: 10px 0 5px 0; font-size: 18px;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="margin: 10px 0 5px 0; font-size: 20px;">$1</h1>')
      .replace(/^[\-\*] (.+)$/gm, '<li style="margin-left: 20px;">$1</li>')
      .replace(/(<li.*?<\/li>\s*)+/g, '<ul style="margin: 5px 0; padding-left: 0;">$&</ul>');
  }

  /**
 * Appends a message to the chat interface and conversation history
 * @param  {string} sender is the message source user or bot
 * @param  {string} text message text
 */
  function appendMessage(sender, text) {
    const messageDiv = document.createElement("div");
    console.log("appendMessage called:", sender, text);
    messageDiv.style.margin = "5px 0";
    messageDiv.style.padding = "10px";
    messageDiv.style.borderRadius = "15px";
    messageDiv.style.maxWidth = "90%";
    messageDiv.style.wordWrap = "break-word";
    messageDiv.style.display = "inline-block";

    if (sender === "user") {
      UserMessageCount = UserMessageCount + 1; 
      messageDiv.style.backgroundColor = "#dcf8c6";
      messageDiv.style.alignSelf = "flex-end";
      messageDiv.style.marginLeft = "auto";
      conversationHistory.push({ role: "user", content: text });
      messageDiv.textContent = text;
    } else {
      messageDiv.style.backgroundColor = "#e4e6eb";
      messageDiv.style.marginRight = "auto";
      conversationHistory.push({ role: "assistant", content: text });
      RemoveResponseInProcess();
      const parsedText = parseMarkdown(text);
      messageDiv.innerHTML = parsedText;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /**
 * Blocks User from typing or sending messages while response generation in process
 */
function ResponseInProcess() {
  disableSend();
	  const process = document.createElement("div");
	  process.className = "response-in-progress";
	  process.style.fontSize = "12px";
	  process.style.color = "#888";
	  process.style.marginTop = "2px";
	  process.style.display = "block";
	  process.textContent = "Waiting for Response";
	  process.style.marginRight = "auto";
	  chatBox.appendChild(process);
	  chatBox.scrollTop = chatBox.scrollHeight;
	  TypingAnimation(process);
}

  /**
 * Allows user to type or send messages again
 */
function RemoveResponseInProcess() {
  const processMessages = chatBox.querySelectorAll(".response-in-progress");
  processMessages.forEach(msg => {
    if (msg.dataset.intervalId) {
      clearInterval(Number(msg.dataset.intervalId));
    }
    chatBox.removeChild(msg);
  });
  enableSend();
}
	
  /**
 * Block Send Function
 */
function disableSend() {
  input.disabled = true;
  sendButton.disabled = true;
  input.placeholder = "Chat disabled.";
  resetButton.disabled = true;
}

  /**
 * Enable Send Function and focuses on input window
 */
function enableSend() {
  input.disabled = false;
  sendButton.disabled = false;
  input.placeholder = "Type your message...";
  input.focus();
  resetButton.disabled = false;
}	

  /**
 * Triggers Typing Animation
 */
function TypingAnimation(process) {
const typingStates = ["Waiting for Response.", "Waiting for Response..", "Waiting for Response...", "Waiting for Response"];
    var index = 0;
    const animationInterval = 500; // in ms
    const typingInterval = setInterval(() => {
      process.textContent = typingStates[index];
      index = (index + 1) % typingStates.length;
    }, animationInterval);
	process.dataset.intervalId = typingInterval;
}

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    window.sendMessage();
  }
});
		
	
  /**
 * Triggers Request to OpenRouter, checks output message and 
 * restarts response generation when output message fails check
 */
async function TriggerOpenrouterRequest() {
  console.log("TriggerOpenrouterRequestPipeline called");
  var attemptLimit = 5;
  var currentAttempt = 0;
  var currentEvaluation = "YES";
  while(currentEvaluation != "NO" && currentAttempt < attemptLimit){
    try{
       var currentMessage = await ChatRequest(conversationHistory);
       console.log("Message:", currentMessage);
       var currentEvaluation = await MessageCheck(currentMessage);
       console.log("Evaluation:", currentEvaluation);
     } catch(error) {
       console.error("Pipeline failed:", error);
  }
  currentAttempt = currentAttempt + 1; 
  }
  if (currentEvaluation === "NO"){
    appendMessage("bot", currentMessage);
  }
}
  /**
 * Sends request to OpenRouter API
 * @param  {string} ChatHistory stringified JSON with the conversation history
 * @return {string} LLM Response
 */
async function ChatRequest(ChatHistory) {
  const Header = new Headers();
  Header.append("Content-Type", "application/json");
  Header.append("Authorization", "Bearer " + apiKey);

  var response = await fetch(url, {
    method: "POST",
    headers: Header,
    body: JSON.stringify({
      model: OR_model,
      messages: ChatHistory
    })
  });
  const returnedResponse = await response.json();
  return returnedResponse.choices[0].message.content.trim();;
}

  /**
 * Evaluates generated message based on EvaluationPrompt
 * @param  {string} Message Message to be checked
 * @return {string} Response to Evaluation Prompt
 */
async function MessageCheck(Message) {
  if(EvaluationNecessary == 1) {
  var CheckPrompt = EvaluationPrompt.replace('{{message_text}}', Message);
  var CheckConversationHistory = [{ role: "user", content: CheckPrompt }];
  return await ChatRequest(CheckConversationHistory);
  }
  else {
    return "NO"
  }
}


// Functions for Buttons
sendButton.addEventListener("click", function () {
  window.sendMessage();
});

resetButton.addEventListener("click", function () {
  window.Reset();
});

submitButton.addEventListener("click", function () {
  window.Submit();
});
	
window.Reset = function()	{	
 document.getElementById("chat-box").innerHTML = "";
 input.value = "";
 historiesArray.push({
    Conversation_number: ResetCounter,
    history: JSON.parse(JSON.stringify(conversationHistory))});
 conversationHistory = [{"role": "system", "content": systemMessage},];
 ResetCounter++; 
 console.log("HistorySaved:", JSON.stringify(conversationHistory));
 enableSend();
   if (LLMinitiates == "1" && LLMinitiates_RepeatOnReset == "1"){
    if (LLMinitiates_Visible == "1") {
      appendMessage("user", LLMinitiates_StartPrompt);
    } else
      {conversationHistory.push({ role: "user", content: LLMinitiates_StartPrompt });
    }
    ResponseInProcess();
    TriggerOpenrouterRequest();
  }
}	

window.Submit = function()	{
let ms = Date.now() - start;
if (ms < (minimumInteractionTime*1000) || UserMessageCount < minimumInteractionCount) {
  if (minimumInteractionCount == 0 && minimumInteractionTime != 0) {alert("Please interact with the Chatbot for at least " + minimumInteractionTime + " seconds!")}
    else if (minimumInteractionTime == 0 && minimumInteractionCount != 0) {alert("Please interact with the Chatbot for at least " + minimumInteractionCount + " messages!")}
	  else{alert("Please interact with the Chatbot for at least " + minimumInteractionTime + " seconds and a minimum of " + minimumInteractionCount + " messages!")}}
else {
    var articleText = article.value.trim();
    if(articleText.length < ArticleMinimumLength) {alert("Please type at least " + ArticleMinimumLength + " characters!")}
	else {
    let confirmation = confirm("Do you really want to end the conversation and proceed?");
    if (confirmation) {
    historiesArray.push({Conversation_number: ResetCounter, history: JSON.parse(JSON.stringify(conversationHistory))});
    Qualtrics.SurveyEngine.setEmbeddedData('ConversationHistory', JSON.stringify(historiesArray));
    let articleText = article.value.trim();
    Qualtrics.SurveyEngine.setEmbeddedData('Article', articleText);
    var nextButton = document.querySelector('.NextButton');
    nextButton.click();
}}}};
	

  window.sendMessage = function () {
    var userText = input.value.trim();
    if (userText === "") return;
    input.value = "";
    appendMessage("user", userText);
	setTimeout(function (){
    ResponseInProcess();         
    }, 250);
    TriggerOpenrouterRequest(); 
  }; 

  if (LLMinitiates == "1"){
    if (LLMinitiates_Visible == "1") {
      appendMessage("user", LLMinitiates_StartPrompt);
      UserMessageCount = UserMessageCount - 1; 
    } else
      {conversationHistory.push({ role: "user", content: LLMinitiates_StartPrompt });
    }
    ResponseInProcess();
    TriggerOpenrouterRequest();
  }

});

Qualtrics.SurveyEngine.addOnReady(function()
{

});

Qualtrics.SurveyEngine.addOnUnload(function()
{

});