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

    // Handle Flow Finished Event
    handleFlowFinish(event) {
        // Trigger a global page refresh to ensure all components are updated
        const refreshEvent = new CustomEvent('force:refreshView');
        this.dispatchEvent(refreshEvent);
    }
}