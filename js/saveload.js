async function saveCard() {
    const selectedDatabase = document.querySelector('#database-select').value;
    const cardData = JSON.parse(JSON.stringify(card));
    const cardName = prompt('Enter the name you would like to save your card under:', getCardName());
    if (!cardName) return;

    const saveSymbolAndWatermark = () => {
        if (setSymbol.src && setSymbol.src.startsWith('data:')) {
            saveImageToLocalArt(setSymbol.src, (savedSetSymbolPath) => {
                if (savedSetSymbolPath) {
                    cardData.setSymbolSource = savedSetSymbolPath;
                }
                saveWatermark();
            });
        } else {
            cardData.setSymbolSource = setSymbol.src;
            saveWatermark();
        }
    };

    const saveWatermark = () => {
        if (watermark.src && watermark.src.startsWith('data:')) {
            saveImageToLocalArt(watermark.src, (savedWatermarkPath) => {
                if (savedWatermarkPath) {
                    cardData.watermarkSource = savedWatermarkPath;
                }
                finalizeSave();
            });
        } else {
            cardData.watermarkSource = watermark.src;
            finalizeSave();
        }
    };

    const finalizeSave = () => {
        proceedToSaveCard(cardName, cardData, selectedDatabase);
    };

    if (art.src && art.src.startsWith('data:')) {
        saveImageToLocalArt(art.src, (savedImagePath) => {
            if (savedImagePath) {
                cardData.artSource = savedImagePath;
                saveSymbolAndWatermark();
            } else {
                alert('Failed to save the card art image. Card not saved.');
            }
        });
    } else {
        cardData.artSource = art.src;
        saveSymbolAndWatermark();
    }
}


function proceedToSaveCard(cardName, cardData, selectedDatabase) {
    fetchFromAPI('/php/database.php', {
        action: 'saveCard',
        database: selectedDatabase,
        name: cardName.trim(),
        data: cardData,
    }).then((result) => {
        if (result.success) {
            loadAvailableCards(selectedDatabase);
        } else {
            alert('Failed to save card: ' + result.message);
        }
    });
}

function saveImageToLocalArt(imageSource, callback) {
    const formData = new FormData();

    // If imageSource is a base64 string, convert to Blob
    if (typeof imageSource === 'string' && imageSource.startsWith('data:image/')) {
        const mimeType = imageSource.match(/data:(image\/[a-zA-Z]+);base64,/)[1];
        const base64Data = imageSource.split(',')[1];
        const binary = atob(base64Data);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        const blob = new Blob([new Uint8Array(array)], { type: mimeType });
        formData.append('image', blob, 'uploaded_image.png');
    } else {
        // Otherwise, assume imageSource is a File object
        formData.append('image', imageSource);
    }

    fetch('/php/saveArt.php', {
        method: 'POST',
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                callback(data.filePath); // Call with the saved file's path
            } else {
                alert('Failed to save the image: ' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error saving the image:', error);
            alert('An unexpected error occurred while saving the image.');
        });
}

async function loadAvailableCards(selectedDatabase) {
    const result = await fetchFromAPI('/php/database.php', {
        action: 'listCards',
        database: selectedDatabase,
    });
    const loadOptions = document.querySelector('#load-card-options');
    loadOptions.innerHTML = '<option selected="selected" disabled>None selected</option>';
    if (result.success) {
        result.cards.forEach((card) => {
            const option = document.createElement('option');
            option.textContent = card.name;
            option.value = card.id;
            loadOptions.appendChild(option);
        });
    } else {
        alert('Failed to load cards: ' + result.message);
    }
}

async function loadCard(cardId) {
    const selectedDatabase = document.querySelector('#database-select').value;

    const result = await fetchFromAPI('/php/database.php', {
        action: 'loadCard',
        id: cardId,
        database: selectedDatabase,
    });

    if (result.success) {
        const cardData = result.data;

        // Append website URL to local image paths
        const baseUrl = window.location.origin + '/php';
        if (cardData.artSource && cardData.artSource.startsWith('/local_art/')) {
            cardData.artSource = baseUrl + cardData.artSource;
        }
        if (cardData.setSymbolSource && cardData.setSymbolSource.startsWith('/local_art/')) {
            cardData.setSymbolSource = baseUrl + cardData.setSymbolSource;
        }
        if (cardData.watermarkSource && cardData.watermarkSource.startsWith('/local_art/')) {
            cardData.watermarkSource = baseUrl + cardData.watermarkSource;
        }

        loadCardDataToCanvas(cardData);
    } else {
        alert('Failed to load card: ' + result.message);
    }
}





async function deleteCard() {
    const cardId = document.querySelector('#load-card-options').value;
    const selectedDatabase = document.querySelector('#database-select').value;

    if (!cardId) return;

    const result = await fetchFromAPI('/php/database.php', {
        action: 'deleteCard',
        id: cardId,
        database: selectedDatabase,
    });

    if (result.success) {
        alert('Card deleted successfully.');
        loadAvailableCards(selectedDatabase); // Refresh the list of saved cards
    } else {
        alert('Failed to delete card: ' + result.message);
    }
}


async function fetchFromAPI(endpoint, data = {}) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
}

async function deleteSavedCards() {
    if (confirm('Are you sure you want to delete all saved cards?')) {
        const result = await fetchFromAPI('/php/database.php', { action: 'deleteAllCards' });
        if (result.success) {
            alert('All cards deleted successfully.');
            loadAvailableCards(); // Refresh the list of saved cards
        } else {
            alert('Failed to delete all cards: ' + result.message);
        }
    }
}

function downloadSavedCards() {
    const link = document.createElement('a');
    link.href = '/php/database.php?action=downloadSavedCards';
    link.download = 'cards.db';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function uploadDb(files) {
    if (files.length === 0) {
        alert('No file selected.');
        return;
    }

    const formData = new FormData();
    formData.append('dbFile', files[0]);

    try {
        const response = await fetch('/php/database.php?action=uploadDb', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (result.success) {
            alert('Database uploaded successfully. Reloading...');
            location.reload(); // Reload the page to reflect the new data
        } else {
            alert('Error uploading database: ' + result.message);
        }
    } catch (error) {
        console.error('Error uploading database:', error);
        alert('An unexpected error occurred.');
    }
}

async function loadCardDataToCanvas(cardData) {
    // Append website URL to local image paths
    const baseUrl = window.location.origin + '/php';
    if (cardData.artSource && cardData.artSource.startsWith('/local_art/')) {
        cardData.artSource = baseUrl + cardData.artSource;
    }
    if (cardData.setSymbolSource && cardData.setSymbolSource.startsWith('/local_art/')) {
        cardData.setSymbolSource = baseUrl + cardData.setSymbolSource;
    }
    if (cardData.watermarkSource && cardData.watermarkSource.startsWith('/local_art/')) {
        cardData.watermarkSource = baseUrl + cardData.watermarkSource;
    }

    // Reset editor to a clean state
    document.querySelector('#frame-list').innerHTML = '';
    card = cardData;

    // Populate editor fields with card data
    document.querySelector('#info-number').value = card.infoNumber || '';
    document.querySelector('#info-rarity').value = card.infoRarity || '';
    document.querySelector('#info-set').value = card.infoSet || '';
    document.querySelector('#info-language').value = card.infoLanguage || '';
    document.querySelector('#info-note').value = card.infoNote || '';
    document.querySelector('#info-year').value = card.infoYear || new Date().getFullYear();

    document.querySelector('#text-editor').value = card.text[Object.keys(card.text)[selectedTextIndex]]?.text || '';
    document.querySelector('#text-editor-font-size').value = card.text[Object.keys(card.text)[selectedTextIndex]]?.fontSize || 0;

    loadTextOptions(card.text);

    document.querySelector('#art-x').value = scaleX(card.artX) - scaleWidth(card.marginX);
    document.querySelector('#art-y').value = scaleY(card.artY) - scaleHeight(card.marginY);
    document.querySelector('#art-zoom').value = (card.artZoom || 1) * 100;
    document.querySelector('#art-rotate').value = card.artRotate || 0;

    uploadArt(card.artSource);

    document.querySelector('#setSymbol-x').value = scaleX(card.setSymbolX) - scaleWidth(card.marginX);
    document.querySelector('#setSymbol-y').value = scaleY(card.setSymbolY) - scaleHeight(card.marginY);
    document.querySelector('#setSymbol-zoom').value = (card.setSymbolZoom || 1) * 100;

    uploadSetSymbol(card.setSymbolSource);

    document.querySelector('#watermark-x').value = scaleX(card.watermarkX) - scaleWidth(card.marginX);
    document.querySelector('#watermark-y').value = scaleY(card.watermarkY) - scaleHeight(card.marginY);
    document.querySelector('#watermark-zoom').value = (card.watermarkZoom || 1) * 100;
    document.querySelector('#watermark-opacity').value = (card.watermarkOpacity || 1) * 100;

    uploadWatermark(card.watermarkSource);

    // Add frames
    card.frames.reverse();
    for (const frame of card.frames) {
        await addFrame([], frame);
    }
    card.frames.reverse();

    // Trigger a redraw on the canvas
    drawCard();
}


async function createDatabase() {
    const dbName = prompt('Enter the new database name:');
    if (!dbName) return;

    const result = await fetchFromAPI('/php/database.php', {
        action: 'createDatabase',
        name: dbName,
    });

    if (result.success) {
        alert(result.message);
        await updateDatabaseDropdown(); // Refresh the dropdown list
        const databaseSelect = document.querySelector('#database-select');

        // Automatically select the newly created database
        const newDbName = dbName.replace(/[^a-zA-Z0-9_-]/g, '_') + '.db';
        databaseSelect.value = newDbName; // Select the new database
        loadAvailableCards(newDbName); // Load cards for the new database
    } else {
        alert('Failed to create database: ' + result.message);
    }
}



async function updateDatabaseDropdown() {
    const result = await fetchFromAPI('/php/database.php', { action: 'listDatabases' });
    const databaseSelect = document.querySelector('#database-select');
    databaseSelect.innerHTML = ''; // Clear existing options
    if (result.success) {
        result.databases.forEach((db) => {
            const option = document.createElement('option');
            option.textContent = db;
            option.value = db;
            databaseSelect.appendChild(option);
        });

        // Ensure the default database is included
        if (!result.databases.includes('cards.db')) {
            const defaultOption = document.createElement('option');
            defaultOption.textContent = 'cards.db';
            defaultOption.value = 'cards.db';
            databaseSelect.appendChild(defaultOption);
        }

        // Automatically select the first database in the list
        if (databaseSelect.options.length > 0) {
            databaseSelect.value = databaseSelect.options[0].value;
            loadAvailableCards(databaseSelect.value); // Load cards for the selected database
        }
    } else {
        alert('Failed to load databases: ' + result.message);
    }
}

async function renameDatabase() {
    const databaseSelect = document.querySelector('#database-select');
    const currentDatabase = databaseSelect.value;

    if (!currentDatabase) {
        alert('Please select a database to rename.');
        return;
    }

    const newDatabaseName = prompt('Enter the new name for the database:', currentDatabase.replace('.db', ''));
    if (!newDatabaseName) return;

    const result = await fetchFromAPI('/php/database.php', {
        action: 'renameDatabase',
        currentName: currentDatabase,
        newName: newDatabaseName,
    });

    if (result.success) {
        alert(result.message);
        await updateDatabaseDropdown(); // Refresh the dropdown list
    } else {
        alert('Failed to rename database: ' + result.message);
    }
}

async function deleteDatabase() {
    const databaseSelect = document.querySelector('#database-select');
    const currentDatabase = databaseSelect.value;

    if (!currentDatabase) {
        alert('Please select a database to delete.');
        return;
    }

    if (!confirm(`Are you sure you want to delete the database '${currentDatabase}'? This action cannot be undone.`)) {
        return;
    }

    const result = await fetchFromAPI('/php/database.php', {
        action: 'deleteDatabase',
        name: currentDatabase,
    });

    if (result.success) {
        alert(result.message);
        await updateDatabaseDropdown(); // Refresh the dropdown list
    } else {
        alert('Failed to delete database: ' + result.message);
    }
}



// Initial load
loadAvailableCards();
updateDatabaseDropdown(); // Update the database dropdown on page load


document.querySelector('#database-select').addEventListener('change', function () {
    const selectedDatabase = this.value;
    if (selectedDatabase) {
        loadAvailableCards(selectedDatabase);
    }
});
