// ═══════════════════════════════════════════════════════════
// Mariza AI — Application Logic
// ═══════════════════════════════════════════════════════════

const API_URL = 'https://madras1-telegrama.hf.space';

// State
let messages = [];
let isLoading = false;

// DOM Elements
const welcomeView = document.getElementById('welcomeView');
const chatView = document.getElementById('chatView');
const welcomeInput = document.getElementById('welcomeInput');
const chatInput = document.getElementById('chatInput');
const messagesContainer = document.getElementById('messagesContainer');
const messagesArea = document.getElementById('messagesArea');
const greetingText = document.getElementById('greetingText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    loadMessages();
    welcomeInput.focus();
});

// Update greeting based on time
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;

    if (hour >= 5 && hour < 12) {
        greeting = 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Boa tarde';
    } else {
        greeting = 'Boa noite';
    }

    greetingText.textContent = greeting;
}

// Load messages from localStorage
function loadMessages() {
    const saved = localStorage.getItem('mariza_chat');
    if (saved) {
        messages = JSON.parse(saved);
        if (messages.length > 0) {
            showChatView();
            messages.forEach(msg => renderMessage(msg.role, msg.content, false));
            scrollToBottom();
        }
    }
}

// Save messages
function saveMessages() {
    localStorage.setItem('mariza_chat', JSON.stringify(messages));
}

// Show chat view
function showChatView() {
    welcomeView.classList.add('hidden');
    chatView.classList.remove('hidden');
    setTimeout(() => chatInput.focus(), 100);
}

// Go back to welcome
function goBack() {
    if (messages.length === 0) {
        chatView.classList.add('hidden');
        welcomeView.classList.remove('hidden');
        welcomeInput.focus();
    }
}

// Render message
function renderMessage(role, content, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (!animate) messageDiv.style.animation = 'none';

    const isUser = role === 'user';
    const formattedContent = formatContent(content);

    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar">${isUser ? '👤' : '✦'}</div>
            <div class="message-name">${isUser ? 'Você' : 'Mariza'}</div>
        </div>
        <div class="message-body">
            <div class="message-text">${formattedContent}</div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
}

// Format content (basic markdown-like)
function formatContent(text) {
    // Escape HTML
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Split into paragraphs
    const paragraphs = escaped.split('\n\n');
    return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

// Show typing indicator
function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typingIndicator';

    typingDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar">✦</div>
            <div class="message-name">Mariza</div>
        </div>
        <div class="message-body">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

// Hide typing
function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

// Scroll to bottom
function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Auto-resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    const maxHeight = textarea === welcomeInput ? 200 : 120;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
}

// Handle keyboard
function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (event.target === welcomeInput) {
            sendFromWelcome();
        } else {
            sendMessage();
        }
    }
}

// Send from welcome screen
function sendFromWelcome() {
    const content = welcomeInput.value.trim();
    if (!content || isLoading) return;

    showChatView();
    welcomeInput.value = '';

    processMessage(content);
}

// Send message from chat
function sendMessage() {
    const content = chatInput.value.trim();
    if (!content || isLoading) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';

    processMessage(content);
}

// Process and send message
async function processMessage(content) {
    // Add user message
    messages.push({ role: 'user', content });
    renderMessage('user', content);
    saveMessages();
    scrollToBottom();

    // Loading state
    isLoading = true;
    document.querySelectorAll('.send-btn, .send-btn-small').forEach(btn => btn.disabled = true);
    showTyping();

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages.map(m => ({ role: m.role, content: m.content }))
            })
        });

        if (!response.ok) throw new Error('API Error');

        const data = await response.json();

        messages.push({ role: 'assistant', content: data.content });
        hideTyping();
        renderMessage('assistant', data.content);
        saveMessages();
        scrollToBottom();

    } catch (error) {
        console.error('Error:', error);
        hideTyping();
        renderMessage('assistant', 'Desculpe, ocorreu um erro. Por favor, tente novamente.');
    } finally {
        isLoading = false;
        document.querySelectorAll('.send-btn, .send-btn-small').forEach(btn => btn.disabled = false);
        chatInput.focus();
    }
}

// Clear chat
function clearChat() {
    if (confirm('Iniciar nova conversa?')) {
        messages = [];
        localStorage.removeItem('mariza_chat');
        messagesContainer.innerHTML = '';
        chatView.classList.add('hidden');
        welcomeView.classList.remove('hidden');
        updateGreeting();
        welcomeInput.focus();
    }
}

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
}
