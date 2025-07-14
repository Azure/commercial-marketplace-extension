class Publisher {
    constructor(id, active) {
        this.id = id;
        this.active = active;
    }
    isActive() {
        return this.active;
    }
    activate() {
        this.active = true;
    }
}

class Publishers {
    constructor() {
        this.publishers = [];
    }
    addPublisher(publisher) {
        var publisher = new Publisher(publisher, true);
        if(undefined == this.publishers.find(publisher => publisher.id === id)){
            this.publishers.push(publisher);
        }
    }
    getPublisher(id) {
        return this.publishers.find(publisher => publisher.id === id);
    }
    getActivePublishers() {
        return this.publishers.filter(publisher => publisher.isActive());
    }
}


// Init: import * as offers from './model/offers.js';
//export function getOffers(){};
//export function saveOffers(){};
var products = [];

// getOffers() and getOfferPlans() are async functions that return a promise
/*export async function getOffers() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('products', (products) => {
            resolve(products);
        });
    });
}

export async function getOfferPlans(offerId) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('products', (products) => {
            var plans = products['products'].filter((item) => item.path[0] == offerId);
            resolve(plans);
        });
    });
}
*/
async function getPublisherId() {
    return new Promise((resolve, reject) => {

        chrome.storage.local.get('publisherId', (data) => {
            resolve(data['publisherId']);
        });
    });
};
var publishers = new Publishers();
$(document).ready(async function() {
    
    var productUrl = 'https://partner.microsoft.com/en-us/dashboard/pss/products?queryType=full&filter=features/any(f:%20search.in(f,%20%27jaguar%27))%20and%20((search.in(productDocumentType,%20%27SoftwareAsAService%27))%20or%20(search.in(productDocumentType,%20%27AzureApplication%27))%20or%20(search.in(productDocumentType,%20%27AzureThirdPartyVirtualMachine%27))%20or%20(search.in(productDocumentType,%20%27AzureContainer%27))%20or%20(search.in(productDocumentType,%20%27AzureConsultingService%27))%20or%20(search.in(productDocumentType,%20%27AzureDynamics365ForCustomerEngagement%27))%20or%20(search.in(productDocumentType,%20%27AzureDynamics365ForOperations%27))%20or%20(search.in(productDocumentType,%20%27AzureDynamics365BusinessCentral%27))%20or%20(search.in(productDocumentType,%20%27AzureIoTEdgeModule%27))%20or%20(search.in(productDocumentType,%20%27AzureManagedService%27))%20or%20(search.in(productDocumentType,%20%27AzurePowerBIApp%27))%20or%20(search.in(productDocumentType,%20%27AzurePowerBIVisual%27)))&orderBy=lastPublisherUpdatedDateTime%20desc&pageSize=50&multiAccount=false';
    const response = await fetch(productUrl);
    const data = await response.json();
    
    publishers.addPublisher(data['items'][0]['publisherId']);
    console.debug('Publisher ID:', publishers );
    for (const product of data['items']) {
        var getPlansUrl = 'https://partner.microsoft.com/en-us/dashboard/pss/variants?queryType=full&filter=productId%20eq%20%27'+product['id']+'%27%20and%20variantType%20eq%20%27azure-sku%27&pageSize=1000';
        const productDataResponse = await fetch(getPlansUrl);
        const plans = await productDataResponse.json();
        product.path = [product['id']];
        for(const plan in plans['items']){
            plans['items'][plan].path = [product['id'],plans['items'][plan]['id']];
            plans['items'][plan].displayName = product['displayName'];
            plans['items'][plan].planName = plans['items'][plan]['variantName'];
            products.push(plans['items'][plan]);
        }
        products.push(product);
    }

    chrome.storage.local.set({ 'products': products }, () => {
        console.log('Products stored in local storage.');
    });
    chrome.storage.local.get('products',(data)=>{
        console.log('Products fetched from local storage.');
        console.debug(data);
    });
});