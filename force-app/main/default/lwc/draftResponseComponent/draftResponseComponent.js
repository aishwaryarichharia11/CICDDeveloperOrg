import { LightningElement, api, wire } from 'lwc';
import { getRecord, updateRecord, getRecordNotifyChange } from 'lightning/uiRecordApi'; // Import getRecordNotifyChange

const FIELDS = ['Case.CRM_Draft_Response__c'];

export default class AutoSaveRichText extends LightningElement {
    @api recordId;
    draftResponse = '';
    isLoaded = false;
    isSaving = false;
    saveTimeout;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredCase({ error, data }) {
        if (data && !this.isLoaded) {
            this.draftResponse = data.fields.CRM_Draft_Response__c.value || '';
            this.isLoaded = true;
        }
    }

    handleInputChange(event) {
        this.draftResponse = event.target.value;

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.isSaving = true;
        this.saveTimeout = setTimeout(() => this.saveDraftResponse(), 500);
    }

    saveDraftResponse() {
        const fields = { Id: this.recordId, CRM_Draft_Response__c: this.draftResponse };
        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.isSaving = false;

                // Notify Lightning Data Service about the record update
                getRecordNotifyChange([{ recordId: this.recordId }]);
            })
            .catch(() => {
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
}
