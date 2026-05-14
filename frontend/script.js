// const chat = document.getElementById("chat");
// const input = document.getElementById("input");

// const USER_ID = "user1";

// function addMessage(role, content) {
//   const div = document.createElement("div");
//   div.className = "message " + role;
//   div.innerHTML = marked.parse(content);

//   chat.appendChild(div);
//   chat.scrollTop = chat.scrollHeight;

//   return div; // 🔥 important for typing effect
// }

// // 🔥 Typing effect
// async function typeMessage(element, text) {
//   element.innerHTML = "";

//   const lines = text.split("\n");

//   for (let i = 0; i < lines.length; i++) {
//     let currentLine = "";
//     const line = lines[i];

//     // create a container for this line
//     const lineDiv = document.createElement("div");
//     element.appendChild(lineDiv);

//     // type character by character
//     for (let j = 0; j < line.length; j++) {
//       currentLine += line[j];

//       // render current line with markdown
//       lineDiv.innerHTML = marked.parse(currentLine);

//       chat.scrollTop = chat.scrollHeight;

//       await new Promise(res => setTimeout(res, 15)); // 🔥 typing speed
//     }

//     // small pause before next line
//     await new Promise(res => setTimeout(res, 200));
//   }
// }

// // 🔥 Send message
// async function sendMessage() {
//   const text = input.value.trim();
//   if (!text) return;

//   addMessage("user", text);
//   input.value = "";

//   // ⏳ loading message
//   const botDiv = addMessage("assistant", "Typing...");

//   try {
//     const res = await fetch("https://rag-dsa-assistant.onrender.com/api/ask", {
//       method: "POST",
//       headers: {"Content-Type": "application/json"},
//       body: JSON.stringify({
//         userId: USER_ID,
//         query: text
//       })
//     });

//     if (!res.ok) throw new Error("Server error");

//     const data = await res.text();

//     // ✨ typing animation
//     await typeMessage(botDiv, data);

//   } catch (err) {
//     botDiv.innerHTML = "❌ Error: " + err.message;
//     console.error(err);
//   }
// }

// // Enter to send
// input.addEventListener("keypress", (e) => {
//   if (e.key === "Enter") sendMessage();
// });
const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn"); // Optional: if you have a send button

const USER_ID = "user1";

// This flag tells us whether a query is currently being processed
let isProcessing = false;

// Add a message to the chat window
function addMessage(role, content) {
  const div = document.createElement("div");
  div.className = "message " + role;
  div.innerHTML = marked.parse(content);

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  return div;
}

// Typing effect for assistant responses
async function typeMessage(element, text) {
  element.innerHTML = "";

  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    let currentLine = "";
    const line = lines[i];

    const lineDiv = document.createElement("div");
    element.appendChild(lineDiv);

    // Type one character at a time
    for (let j = 0; j < line.length; j++) {
      currentLine += line[j];
      lineDiv.innerHTML = marked.parse(currentLine);

      chat.scrollTop = chat.scrollHeight;

      // Typing speed (15 ms per character)
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    // Small pause between lines
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

// Send a message to the backend
async function sendMessage() {
  // If a previous query is still running, do nothing
  if (isProcessing) return;

  const text = input.value.trim();
  if (!text) return;

  // Lock the UI until the full response is finished
  isProcessing = true;
  input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  // Show the user's message
  addMessage("user", text);

  // Clear input box
  input.value = "";

  // Placeholder for assistant response
  const botDiv = addMessage("assistant", "Typing...");

  try {
    const res = await fetch("https://rag-dsa-assistant.onrender.com/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: USER_ID,
        query: text,
      }),
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.text();

    // Wait until typing animation completes
    await typeMessage(botDiv, data);
  } catch (err) {
    botDiv.innerHTML = "❌ Error: " + err.message;
    console.error(err);
  } finally {
    // Unlock the UI only after everything is complete
    isProcessing = false;
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

// Press Enter to send a message
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !isProcessing) {
    sendMessage();
  }
});

// Optional: click button to send
if (sendBtn) {
  sendBtn.addEventListener("click", () => {
    if (!isProcessing) {
      sendMessage();
    }
  });
}
