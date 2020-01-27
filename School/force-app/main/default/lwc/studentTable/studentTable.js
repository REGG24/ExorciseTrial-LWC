import { LightningElement, wire, track } from 'lwc';
import getContactList from '@salesforce/apex/ContactController.getContactList';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import FIRSTNAME_FIELD from '@salesforce/schema/Student__c.Name';
import LASTNAME_FIELD from '@salesforce/schema/Student__c.Last_Name__c';
import CLASSROOM_FIELD from '@salesforce/schema/Student__c.Classroom__c';
import ID_FIELD from '@salesforce/schema/Student__c.Id';

const COLS = [
    { label: 'First Name', fieldName: 'Name', editable: true },
    { label: 'Last Name', fieldName: 'Last_Name__c', editable: true },
    { label: 'Classroom', fieldName: 'Classroom__c' }
];
export default class DatatableUpdateExample extends LightningElement {

    @track error;
    @track columns = COLS;
    @track draftValues = [];

    @wire(getContactList)
    contact;

    handleSave(event) {

        const fields = {};
        fields[ID_FIELD.fieldApiName] = event.detail.draftValues[0].Id;
        fields[FIRSTNAME_FIELD.fieldApiName] = event.detail.draftValues[0].Name;
        fields[LASTNAME_FIELD.fieldApiName] = event.detail.draftValues[0].Last_Name__c;
        fields[CLASSROOM_FIELD.fieldApiName] = event.detail.draftValues[0].Classroom__c;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Contact updated',
                        variant: 'success'
                    })
                );
                // Clear all draft values
                this.draftValues = [];

                // Display fresh data in the datatable
                return refreshApex(this.contact);
            }).catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}