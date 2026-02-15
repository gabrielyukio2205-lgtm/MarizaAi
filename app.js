// ═══════════════════════════════════════════════════════════
// Mariza AI — Application with Conversation History
// ═══════════════════════════════════════════════════════════

const API_URL = 'https://madras1-telegrama.hf.space';

// State
let conversations = {};
let currentConversationId = null;
let isLoading = false;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const conversationsList = document.getElementById('conversationsList');
const welcomeView = document.getElementById('welcomeView');
const chatView = document.getElementById('chatView');
const welcomeInput = document.getElementById('welcomeInput');
const chatInput = document.getElementById('chatInput');
const messagesContainer = document.getElementById('messagesContainer');
const messagesArea = document.getElementById('messagesArea');
const greetingText = document.getElementById('greetingText');
const chatTitle = document.getElementById('chatTitle');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const highlightThemeLink = document.getElementById('highlight-theme');

// ═══════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    updateGreeting();
    loadConversations();
    renderConversationsList();
    welcomeInput.focus();
});

// ═══════════════════════════════════════════════════════════
// Sidebar
// ═══════════════════════════════════════════════════════════

function toggleSidebar() {
    if (window.innerWidth > 768) {
        sidebar.classList.toggle('collapsed');
    } else {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('visible');
    }
}

function closeSidebar() {
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('visible');
    }
}

// ═══════════════════════════════════════════════════════════
// Conversations Management
// ═══════════════════════════════════════════════════════════

function loadConversations() {
    const saved = localStorage.getItem('mariza_conversations');
    if (saved) {
        conversations = JSON.parse(saved);
    }
}

function saveConversations() {
    localStorage.setItem('mariza_conversations', JSON.stringify(conversations));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getConversationTitle(messages) {
    if (messages.length === 0) return 'Nova conversa';
    const firstMsg = messages[0].content;
    return firstMsg.length > 40 ? firstMsg.substring(0, 40) + '...' : firstMsg;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function renderConversationsList() {
    const sortedConversations = Object.entries(conversations)
        .sort((a, b) => b[1].updatedAt - a[1].updatedAt);

    if (sortedConversations.length === 0) {
        conversationsList.innerHTML = `
            <div style="padding: 24px 16px; text-align: center; color: var(--text-tertiary); font-size: 14px;">
                Nenhuma conversa ainda
            </div>
        `;
        return;
    }

    conversationsList.innerHTML = sortedConversations.map(([id, conv]) => `
        <button class="conversation-item ${id === currentConversationId ? 'active' : ''}" onclick="openConversation('${id}')">
            <span class="conversation-icon">💬</span>
            <span class="conversation-title">${escapeHtml(getConversationTitle(conv.messages))}</span>
            <span class="conversation-date">${formatDate(conv.updatedAt)}</span>
        </button>
    `).join('');
}

function createNewChat() {
    currentConversationId = null;
    messagesContainer.innerHTML = '';

    chatView.classList.add('hidden');
    welcomeView.classList.remove('hidden');

    closeSidebar();
    updateGreeting();
    welcomeInput.focus();

    renderConversationsList();
}

function openConversation(id) {
    currentConversationId = id;
    const conv = conversations[id];

    if (!conv) return;

    messagesContainer.innerHTML = '';
    conv.messages.forEach(msg => renderMessage(msg.role, msg.content, false));

    chatTitle.textContent = getConversationTitle(conv.messages);

    welcomeView.classList.add('hidden');
    chatView.classList.remove('hidden');

    closeSidebar();
    scrollToBottom();
    chatInput.focus();

    renderConversationsList();
}

function deleteCurrentChat() {
    if (!currentConversationId) return;

    if (confirm('Excluir esta conversa?')) {
        delete conversations[currentConversationId];
        saveConversations();
        createNewChat();
    }
}

function clearAllData() {
    if (confirm('Excluir todas as conversas?')) {
        conversations = {};
        localStorage.removeItem('mariza_conversations');
        createNewChat();
    }
}

// ═══════════════════════════════════════════════════════════
// Theme
// ═══════════════════════════════════════════════════════════

function loadTheme() {
    const theme = localStorage.getItem('mariza_theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeUI(true);
    } else if (theme === 'light') {
        document.body.classList.remove('dark-mode');
        updateThemeUI(false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
        updateThemeUI(true);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('mariza_theme', isDark ? 'dark' : 'light');
    updateThemeUI(isDark);
}

function updateThemeUI(isDark) {
    if (highlightThemeLink) {
        highlightThemeLink.href = isDark
            ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
            : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    }

    if (themeToggleBtn) {
        const span = themeToggleBtn.querySelector('span');
        const svg = themeToggleBtn.querySelector('svg');

        if (isDark) {
            span.textContent = 'Modo Claro';
            svg.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
        } else {
            span.textContent = 'Modo Escuro';
            svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#1a1815' : '#faf9f7');
    }
}

// ═══════════════════════════════════════════════════════════
// Greeting
// ═══════════════════════════════════════════════════════════

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;

    if (hour >= 5 && hour < 12) greeting = 'Bom dia';
    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
    else greeting = 'Boa noite';

    greetingText.textContent = greeting;
}

// ═══════════════════════════════════════════════════════════
// Messages
// ═══════════════════════════════════════════════════════════

function renderMessage(role, content, animate = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (!animate) messageDiv.style.animation = 'none';

    const isUser = role === 'user';
    const formattedContent = isUser ? escapeHtml(content) : formatMarkdown(content);

    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar">${isUser ? '👤' : '✦'}</div>
            <div class="message-name">${isUser ? 'Você' : 'Mariza'}</div>
        </div>
        <div class="message-body">
            <div class="message-text ${isUser ? '' : 'markdown-body'}">${formattedContent}</div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);

    // Apply syntax highlighting to code blocks
    if (!isUser) {
        messageDiv.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });

        // Add copy buttons
        messageDiv.querySelectorAll('pre').forEach(pre => {
            if (pre.querySelector('.copy-btn')) return;

            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copiar</span>
            `;

            btn.onclick = () => {
                const code = pre.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    btn.classList.add('copied');
                    btn.querySelector('span').textContent = 'Copiado!';
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.querySelector('span').textContent = 'Copiar';
                    }, 2000);
                });
            };

            pre.appendChild(btn);
        });
    }
}

// Configure marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

function formatMarkdown(text) {
    const rawHtml = marked.parse(text);
    return DOMPurify.sanitize(rawHtml);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
            <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
    `;

    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    const maxHeight = textarea === welcomeInput ? 200 : 120;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
}

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

// ═══════════════════════════════════════════════════════════
// Send Messages
// ═══════════════════════════════════════════════════════════

function sendFromWelcome() {
    const content = welcomeInput.value.trim();
    if (!content || isLoading) return;

    // Create new conversation
    currentConversationId = generateId();
    conversations[currentConversationId] = {
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    welcomeView.classList.add('hidden');
    chatView.classList.remove('hidden');
    welcomeInput.value = '';

    processMessage(content);
}

function sendMessage() {
    const content = chatInput.value.trim();
    if (!content || isLoading) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';

    processMessage(content);
}

async function processMessage(content) {
    const conv = conversations[currentConversationId];

    // Add user message
    conv.messages.push({ role: 'user', content });
    conv.updatedAt = Date.now();
    saveConversations();

    renderMessage('user', content);
    chatTitle.textContent = getConversationTitle(conv.messages);
    renderConversationsList();
    scrollToBottom();

    // Loading
    isLoading = true;
    document.querySelectorAll('.send-btn, .send-btn-small').forEach(btn => btn.disabled = true);
    showTyping();

    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: conv.messages.map(m => ({ role: m.role, content: m.content }))
            })
        });

        if (!response.ok) throw new Error('API Error');

        const data = await response.json();

        conv.messages.push({ role: 'assistant', content: data.content });
        conv.updatedAt = Date.now();
        saveConversations();

        hideTyping();
        renderMessage('assistant', data.content);
        scrollToBottom();

    } catch (error) {
        console.error('Error:', error);
        hideTyping();
        renderMessage('assistant', 'Desculpe, ocorreu um erro. Tente novamente.');
    } finally {
        isLoading = false;
        document.querySelectorAll('.send-btn, .send-btn-small').forEach(btn => btn.disabled = false);
        chatInput.focus();
    }
}

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
}
