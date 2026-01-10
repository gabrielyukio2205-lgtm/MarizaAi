// ========================================
// Mariza AI - Chat Application
// ========================================

// API Configuration - Change this to your HF Spaces URL
const API_URL = 'https://madras1-telegrama.hf.space';

// State
let messages = [];
let isLoading = false;

// DOM Elements
const chatArea = document.getElementById('chatArea');
const welcomeScreen = document.getElementById('welcomeScreen');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    messageInput.focus();
});

// Load messages from localStorage
function loadMessages() {
    const saved = localStorage.getItem('mariza_messages');
    if (saved) {
        messages = JSON.parse(saved);
        if (messages.length > 0) {
            welcomeScreen.classList.add('hidden');
            messages.forEach(msg => renderMessage(msg.role, msg.content, false));
            scrollToBottom();
        }
    }
}

// Save messages
function saveMessages() {
    localStorage.setItem('mariza_messages', JSON.stringify(messages));
}

// Render message
function renderMessage(role, content, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (!animate) messageDiv.style.animation = 'none';

    const isUser = role === 'user';

    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? '👤' : '✨'}</div>
        <div class="message-content">
            <div class="message-role">${isUser ? 'Você' : 'Mariza'}</div>
            <div class="message-text">${escapeHtml(content)}</div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show typing indicator
function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typingIndicator';

    typingDiv.innerHTML = `
        <div class="message-avatar">✨</div>
        <div class="message-content">
            <div class="message-role">Mariza</div>
            <div class="typing">
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
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Auto-resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// Handle keyboard
function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Use suggestion
function useSuggestion(text) {
    messageInput.value = text;
    messageInput.focus();
    autoResize(messageInput);
}

// Send message
async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || isLoading) return;

    // Hide welcome
    welcomeScreen.classList.add('hidden');

    // Add user message
    messages.push({ role: 'user', content });
    renderMessage('user', content);
    saveMessages();
    scrollToBottom();

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Loading state
    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
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
        renderMessage('assistant', '❌ Desculpe, algo deu errado. Tente novamente.');
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Clear chat
function clearChat() {
    messages = [];
    localStorage.removeItem('mariza_messages');
    messagesContainer.innerHTML = '';
    welcomeScreen.classList.remove('hidden');
    messageInput.focus();
}

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
}
