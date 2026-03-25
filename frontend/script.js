const chat = document.getElementById("chat");
const input = document.getElementById("input");

const USER_ID = "user1";

function addMessage(role, content) {
  const div = document.createElement("div");
  div.className = "message " + role;
  div.innerHTML = marked.parse(content);

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  return div; // 🔥 important for typing effect
}

// 🔥 Typing effect
async function typeMessage(element, text) {
  element.innerHTML = "";
  let i = 0;

  while (i < text.length) {
    element.innerHTML += text[i];
    i++;

    chat.scrollTop = chat.scrollHeight;

    await new Promise(res => setTimeout(res, 15)); // speed control
  }

  // render markdown after typing
  element.innerHTML = marked.parse(text);
}

// 🔥 Send message
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ⏳ loading message
  const botDiv = addMessage("assistant", "Typing...");

  try {
    const res = await fetch("http://localhost:3000/api/ask", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        userId: USER_ID,
        query: text
      })
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.text();

    // ✨ typing animation
    await typeMessage(botDiv, data);

  } catch (err) {
    botDiv.innerHTML = "❌ Error: " + err.message;
    console.error(err);
  }
}

// Enter to send
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
