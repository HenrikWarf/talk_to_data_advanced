document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('suggestionModal');
    const closeButton = document.querySelector('.close-button');
    const suggestionButton = document.getElementById('suggestionButton');
    const generateSuggestionsModalButton = document.getElementById('generateSuggestionsModalButton');
    const categoryList = document.getElementById('categoryList');
    const suggestionList = document.getElementById('suggestionList');
    const modalBody = document.querySelector('.modal-body');
    const modalHeaderButton = document.querySelector('.modal-header-button');

    suggestionButton.addEventListener('click', () => {
        modal.style.display = 'block';
        modalHeaderButton.style.display = 'flex';
        modalBody.style.display = 'none';
    });

    generateSuggestionsModalButton.addEventListener('click', async () => {
        await fetchSuggestions();
    });

    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    async function fetchSuggestions(category = null, clickedListItem = null) {
        if (clickedListItem) {
            clickedListItem.innerHTML = `${category} <div class="loading-spinner-small"></div>`;
        } else {
            generateSuggestionsModalButton.classList.add('loading');
            generateSuggestionsModalButton.innerHTML = '<div class="loading-spinner"></div>';
        }
        suggestionList.innerHTML = ''; // Clear previous suggestions

        const schema = Array.from(document.querySelectorAll('.column-name')).map(el => el.textContent).join(', ');

        try {
            const response = await fetch('http://127.0.0.1:8000/generate-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schema, category }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            renderSuggestions(data.suggestions);
            if (!category) {
                renderCategories(data.suggestions);
            }
            modalHeaderButton.style.display = 'none';
            modalBody.style.display = 'flex';
        } catch (error) {
            suggestionList.innerHTML = `<div class="suggestion-item">Error: ${error.message}</div>`;
        } finally {
            if (clickedListItem) {
                clickedListItem.innerHTML = category;
            } else {
                generateSuggestionsModalButton.classList.remove('loading');
                generateSuggestionsModalButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-crosshair"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>';
            }
        }
    }

    function renderSuggestions(suggestions) {
        suggestionList.innerHTML = '';
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');

            const header = document.createElement('div');
            header.classList.add('suggestion-category-header');

            const categoryElement = document.createElement('div');
            categoryElement.classList.add('suggestion-category');
            categoryElement.textContent = suggestion.category;

            const editButton = document.createElement('button');
            editButton.classList.add('edit-suggestion-button');
            editButton.innerHTML = '&#9998;'; // Pencil icon

            header.appendChild(categoryElement);
            header.appendChild(editButton);

            const textElement = document.createElement('div');
            textElement.classList.add('suggestion-text');
            textElement.textContent = suggestion.suggestion;

            const textarea = document.createElement('textarea');
            textarea.classList.add('edit-suggestion-textarea');
            textarea.value = suggestion.suggestion;
            textarea.rows = 3;

            const executeButton = document.createElement('button');
            executeButton.classList.add('execute-suggestion-button');
            executeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

            suggestionItem.appendChild(header);
            suggestionItem.appendChild(textElement);
            suggestionItem.appendChild(textarea);
            suggestionItem.appendChild(executeButton);

            editButton.addEventListener('click', () => {
                const isEditing = textElement.style.display === 'none';
                textElement.style.display = isEditing ? 'block' : 'none';
                textarea.style.display = isEditing ? 'none' : 'block';
                editButton.innerHTML = isEditing ? '&#9998;' : 'Save';
                if (isEditing) {
                    // Save the changes
                    textElement.textContent = textarea.value;
                }
            });

            executeButton.addEventListener('click', () => {
                const query = textarea.style.display === 'none' ? textElement.textContent : textarea.value;
                document.getElementById('queryInput').value = query;
                askAgent(query);
                closeModal();
            });

            suggestionList.appendChild(suggestionItem);
        });
    }

    function renderCategories(suggestions) {
        const categories = [...new Set(suggestions.map(s => s.category))];
        categoryList.innerHTML = '';
        categories.forEach(category => {
            const listItem = document.createElement('li');
            listItem.textContent = category;
            listItem.addEventListener('click', async () => {
                document.querySelectorAll('#categoryList li').forEach(li => li.classList.remove('active'));
                listItem.classList.add('active');
                await fetchSuggestions(category, listItem);
            });
            categoryList.appendChild(listItem);
        });
    }
});
