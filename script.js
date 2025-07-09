// Application State
let appState = {
    currentView: 'home', // 'home', 'state', 'monument'
    currentState: null,
    currentMonument: null,
    selectedCategory: 'all',
    selectedFilter: 'all',
    searchTerm: '',
    statesData: [],
    monumentsData: []
};

// DOM Elements
const elements = {
    mainContent: document.getElementById('mainContent'),
    heroSection: document.getElementById('heroSection'),
    statesSection: document.getElementById('statesSection'),
    stateDetailSection: document.getElementById('stateDetailSection'),
    monumentDetailSection: document.getElementById('monumentDetailSection'),
    statesGrid: document.getElementById('statesGrid'),
    monumentsGrid: document.getElementById('monumentsGrid'),
    stateTitle: document.getElementById('stateTitle'),
    stateDescription: document.getElementById('stateDescription'),
    monumentInfo: document.getElementById('monumentInfo'),
    monumentLocation: document.getElementById('monumentLocation'),
    searchInput: document.getElementById('searchInput'),
    backToStates: document.getElementById('backToStates'),
    backToMonuments: document.getElementById('backToMonuments')
};

// Initialize Application
async function initApp() {
    try {
        await loadData();
        setupEventListeners();
        renderStates();
        showSection('home');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Load Data
async function loadData() {
    try {
        const [statesResponse, monumentsResponse, keralaResponse, westBengalResponse] = await Promise.all([
            fetch('./data/states.json'),
            fetch('./data/monuments.json'),
            fetch('./data/kerala.json'),
            fetch('./data/westBengal.json')
        ]);
        
        appState.statesData = await statesResponse.json();
        const generalMonuments = await monumentsResponse.json();
        const keralaMonuments = await keralaResponse.json();
        const westBengalMonuments = await westBengalResponse.json();
        
        // Combine all monument data
        appState.monumentsData = [
            ...generalMonuments,
            ...keralaMonuments,
            ...westBengalMonuments
        ];
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to sample data if files don't exist
        appState.statesData = getSampleStatesData();
        appState.monumentsData = getSampleMonumentsData();
    }
}

// Event Listeners
function setupEventListeners() {
    // Navigation category buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            appState.selectedCategory = e.target.dataset.category;
            if (appState.currentView === 'state') {
                filterMonuments();
            }
        });
    });

    // Filter buttons in state detail
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            appState.selectedFilter = e.target.dataset.filter;
            filterMonuments();
        });
    });

    // Search input
    elements.searchInput.addEventListener('input', debounce((e) => {
        appState.searchTerm = e.target.value.toLowerCase();
        if (appState.currentView === 'state') {
            filterMonuments();
        }
    }, 300));

    // Back buttons
    elements.backToStates.addEventListener('click', () => showSection('home'));
    elements.backToMonuments.addEventListener('click', () => showSection('state'));
}

// Show Section
function showSection(section) {
    // Hide all sections
    elements.heroSection.classList.add('hidden');
    elements.statesSection.classList.add('hidden');
    elements.stateDetailSection.classList.add('hidden');
    elements.monumentDetailSection.classList.add('hidden');

    // Show appropriate section
    switch (section) {
        case 'home':
            elements.heroSection.classList.remove('hidden');
            elements.statesSection.classList.remove('hidden');
            appState.currentView = 'home';
            break;
        case 'state':
            elements.stateDetailSection.classList.remove('hidden');
            appState.currentView = 'state';
            break;
        case 'monument':
            elements.monumentDetailSection.classList.remove('hidden');
            appState.currentView = 'monument';
            break;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render States
function renderStates() {
    console.log('States data:', appState.statesData); // Add this line
    elements.statesGrid.innerHTML = '';
    appState.statesData.forEach((state, index) => {
        const stateCard = createStateCard(state, index);
        elements.statesGrid.appendChild(stateCard);
    });
}

// Create State Card
function createStateCard(state, index) {
    const card = document.createElement('div');
    card.className = 'state-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="state-card-image" style="background-image: url('${state.image}')">
            <div class="state-card-content">
                <h3>${state.name}</h3>
                <p>${state.monumentCount || 0} Heritage Sites</p>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showStateDetail(state));
    
    return card;
}

// Show State Detail
function showStateDetail(state) {
    appState.currentState = state;
    elements.stateTitle.textContent = state.name;
    elements.stateDescription.textContent = state.description;
    
    renderMonuments();
    showSection('state');
}

// Render Monuments
function renderMonuments() {
    if (!appState.currentState) return;
    
    const stateMonuments = appState.monumentsData.filter(
        monument => monument.state === appState.currentState.id
    );
    
    appState.currentStateMonuments = stateMonuments;
    filterMonuments();
}

// Filter Monuments
function filterMonuments() {
    if (!appState.currentStateMonuments) return;
    
    let filteredMonuments = appState.currentStateMonuments;
    
    // Filter by category
    if (appState.selectedFilter !== 'all') {
        filteredMonuments = filteredMonuments.filter(
            monument => monument.type.toLowerCase() === appState.selectedFilter
        );
    }
    
    // Filter by search term
    if (appState.searchTerm) {
        filteredMonuments = filteredMonuments.filter(monument =>
            monument.name.toLowerCase().includes(appState.searchTerm) ||
            monument.location.toLowerCase().includes(appState.searchTerm) ||
            monument.description.toLowerCase().includes(appState.searchTerm)
        );
    }
    
    displayMonuments(filteredMonuments);
}

// Display Monuments
function displayMonuments(monuments) {
    elements.monumentsGrid.innerHTML = '';
    
    if (monuments.length === 0) {
        elements.monumentsGrid.innerHTML = `
            <div class="no-results">
                <p>No monuments found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    monuments.forEach((monument, index) => {
        const monumentCard = createMonumentCard(monument, index);
        elements.monumentsGrid.appendChild(monumentCard);
    });
}

// Create Monument Card
function createMonumentCard(monument, index) {
    const card = document.createElement('div');
    card.className = 'monument-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="monument-card-image" style="background-image: url('${monument.image}')"></div>
        <div class="monument-card-content">
            <h4>${monument.name}</h4>
            <span class="monument-type">${monument.type}</span>
            <div class="monument-location">${monument.location}</div>
            <p>${monument.description}</p>
        </div>
    `;
    
    card.addEventListener('click', () => showMonumentDetail(monument));
    
    return card;
}

// Show Monument Detail
function showMonumentDetail(monument) {
    appState.currentMonument = monument;
    
    // Render monument information according to the specified layout template
    elements.monumentInfo.innerHTML = `
        <div class="monument-template">
            <div class="template-header">
                <h2 class="template-title">SANSKRITIC DHAROHAR</h2>
            </div>
            <div class="template-image-section">
                <div class="template-image-placeholder">Picture</div>
            </div>
            <div class="template-three-columns">
                <div class="template-column">
                    <h3 class="template-column-title">NAME OF THE MONUMENTS</h3>
                    <ul class="template-list">
                        <li>Main Prasad: ${monument.mainPrasad || 'Not specified'}</li>
                        <li>Open timings: ${monument.timings || 'Open daily: 6:00 AM - 8:00 PM'}</li>
                        <li>Prayers Timing: ${monument.prayersTiming || 'Not specified'}</li>
                        <li>Other deities: ${monument.otherDeities || 'Not specified'}</li>
                        <li>Amenities: ${monument.amenities || 'Not specified'}</li>
                        <li>Drinking Water: ${monument.drinkingWater || 'Available'}</li>
                        <li>Pooja Items Shops: ${monument.poojaItemsShops || 'Available nearby'}</li>
                        <li>Restrooms: ${monument.restrooms || 'Available'}</li>
                        <li>Festival: ${monument.festivals || 'Various religious festivals celebrated'}</li>
                        <li>Marriage (if being happen): ${monument.marriage || 'Not specified'}</li>
                        <li>Education (if provided): ${monument.education || 'Not specified'}</li>
                        <li>Daan Dakshina: ${monument.daanDakshina || 'Accepted'}</li>
                        <li>Flowers (Jo chadhaya jata hai): ${monument.flowers || 'Not specified'}</li>
                        <li>Food available for people (like langar): ${monument.foodAvailable || 'Not specified'}</li>
                        <li>Videos clips & links: ${monument.videoLinks || 'Not available'}</li>
                    </ul>
                </div>
                <div class="template-column">
                    <strong><em class="template-main-content">MAIN CONTENT</em></strong>
                    <p class="template-description">${monument.description}</p>
                </div>
                <div class="template-column">
                    <h3 class="template-column-title">Location</h3>
                    <ul class="template-list">
                        <li>Google maps: ${monument.googleMaps || 'Interactive Map (Google Maps Integration)'}</li>
                        <li>Weather Details (like which month has which season): ${monument.weatherDetails || 'October to March pleasant'}</li>
                        <li>Sea level: ${monument.seaLevel || 'Not specified'}</li>
                        <li>How to reach:</li>
                        <li>Nearest Bus Station: ${monument.nearestBusStation || 'Not specified'}</li>
                        <li>Nearest Railway Station: ${monument.nearestRailwayStation || 'Not specified'}</li>
                        <li>Nearest Airport: ${monument.nearestAirport || 'Not specified'}</li>
                        <li>Nearby Restaurants: ${monument.nearbyRestaurants || 'Available nearby'}</li>
                        <li>Nearby Hotels (Top 5 best & top 5 cheap): ${(monument.nearbyHotels || ['Hotel Heritage Inn', 'Royal Palace Hotel', 'Budget Stay Lodge']).join(', ')}</li>
                        <li>Nearby Non-religious or Religious Places to go for: ${monument.nearbyPlaces || 'Not specified'}</li>
                        <li>Famous food that can be tasted: ${monument.famousFood || 'Local cuisine available'}</li>
                        <li>Contact details of the monument: ${monument.contactDetails || 'Not specified'}</li>
                        <li>Website of the monument (if any): ${monument.website || 'Not available'}</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    // Clear monumentLocation as it's now included in the three-column layout
    elements.monumentLocation.innerHTML = '';
    
    showSection('monument');
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sample Data (fallback)
function getSampleStatesData() {
    return [
        {
            id: 'rajasthan',
            name: 'Rajasthan',
            image: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'The land of kings, featuring magnificent palaces, forts, and temples.',
            monumentCount: 15
        },
        {
            id: 'uttar-pradesh',
            name: 'Uttar Pradesh',
            image: 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'Home to the iconic Taj Mahal and numerous historical monuments.',
            monumentCount: 20
        },
        {
            id: 'kerala',
            name: 'Kerala',
            image: 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'Gods own country with beautiful temples and churches.',
            monumentCount: 12
        },
        {
            id: 'tamil-nadu',
            name: 'Tamil Nadu',
            image: 'https://images.pexels.com/photos/3811082/pexels-photo-3811082.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'Rich Dravidian architecture and ancient temples.',
            monumentCount: 18
        }
    ];
}

function getSampleMonumentsData() {
    return [
        {
            id: 'hawa-mahal',
            name: 'Hawa Mahal',
            state: 'rajasthan',
            type: 'palace',
            location: 'Jaipur, Rajasthan',
            image: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'The Palace of Winds, a stunning example of Rajput architecture.',
            timings: '9:00 AM - 4:30 PM',
            entryFee: '₹50 for Indians, ₹200 for foreigners',
            bestTime: 'October to March',
            facilities: ['Parking', 'Audio Guide', 'Museum', 'Cafeteria'],
            address: 'Hawa Mahal Rd, Badi Choupad, J.D.A. Market, Pink City, Jaipur, Rajasthan 302002',
            howToReach: 'Jaipur Airport is 13 km away. Well connected by road and rail.',
            nearbyHotels: ['Taj Rambagh Palace', 'The Oberoi Rajvilas', 'Hotel Pearl Palace'],
            festivals: 'Teej Festival, Gangaur Festival',
            photography: 'Photography allowed with additional charges'
        },
        {
            id: 'taj-mahal',
            name: 'Taj Mahal',
            state: 'uttar-pradesh',
            type: 'mausoleum',
            location: 'Agra, Uttar Pradesh',
            image: 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&w=800',
            description: 'A UNESCO World Heritage Site and symbol of eternal love.',
            timings: 'Sunrise to Sunset (Closed on Fridays)',
            entryFee: '₹50 for Indians, ₹1100 for foreigners',
            bestTime: bestTime: 'October to March',
            facilities: ['Parking', 'Security', 'Audio Guide', 'Battery Van'],
            address: 'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001',
            howToReach: 'Agra Airport is 7 km away. Well connected by train and road.',
            nearbyHotels: ['The Oberoi Amarvilas', 'ITC Mughal', 'Hotel Taj Resorts'],
            festivals: 'Taj Mahotsav (February)',
            photography: 'Photography allowed, no tripods inside main mausoleum'
        }
    ];
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);