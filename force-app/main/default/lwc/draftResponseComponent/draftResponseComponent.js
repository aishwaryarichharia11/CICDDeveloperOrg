import { LightningElement, api, wire } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

const FIELDS = ['Case.CRM_Draft_Response__c'];

export default class AutoSaveRichText extends LightningElement {
    @api recordId;
    draftResponse = '';
    isLoaded = false;
    isSaving = false;
    saveTimeout;

    wiredRecord; // Store the wired result for refreshApex

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredCase(result) {
        this.wiredRecord = result; // Save the result for refreshApex
        const { data, error } = result;

        if (data && !this.isLoaded) {
            this.draftResponse = data.fields.CRM_Draft_Response__c.value || '';
            this.isLoaded = true;
        } else if (error) {
            console.error('Error loading record:', error);
        }
    }

    handleInputChange(event) {
        this.draftResponse = event.target.value;

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.isSaving = true;

        // Use a debounce to save only after typing stops for 1 second
        this.saveTimeout = setTimeout(() => this.saveDraftResponse(), 1000);
    }

    saveDraftResponse() {
        const fields = { Id: this.recordId, CRM_Draft_Response__c: this.draftResponse };
        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isSaving = false;

                // Refresh the wired record to fetch the latest backend value
                return refreshApex(this.wiredRecord);
            })
            .catch((error) => {
                console.error('Error saving record:', error);
                this.isSaving = false;
            });
    }

    get saveIndicator() {
        return this.isSaving ? 'Saving...' : 'Saved';
    }

    renderedCallback() {
        // Wait for the DOM to render and customize the toolbar
        this.applyDefaultStyles();
    }

    applyDefaultStyles() {
        // Access the rich text input DOM
        const richTextEditor = this.template.querySelector('lightning-input-rich-text');
        if (richTextEditor) {
            // Use a timeout to ensure the toolbar is available
            setTimeout(() => {
                const toolbar = richTextEditor.shadowRoot.querySelector('.ql-toolbar');
                if (toolbar) {
                    // Set the default font to Arial
                    const fontDropdown = toolbar.querySelector('.ql-font');
                    if (fontDropdown) {
                        fontDropdown.value = 'Arial';
                        fontDropdown.dispatchEvent(new Event('change')); // Apply change
                    }

                    // Set the default font size to 16px
                    const sizeDropdown = toolbar.querySelector('.ql-size');
                    if (sizeDropdown) {
                        sizeDropdown.value = '16px';
                        sizeDropdown.dispatchEvent(new Event('change')); // Apply change
                    }
                }
            }, 100); // Delay to ensure toolbar is ready
        }
    }

    // Handle Flow Finished Event
    handleFlowFinish(event) {
        // Refresh the record after the Screen Flow finishes
        refreshApex(this.wiredRecord);
    }
}