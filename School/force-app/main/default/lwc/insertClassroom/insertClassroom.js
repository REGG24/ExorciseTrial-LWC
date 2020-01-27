import { LightningElement, track } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CLASSROOM_OBJECT from '@salesforce/schema/Classroom__c';
import NAME_FIELD from '@salesforce/schema/Classroom__c.Name';

export default class insertClassroom extends LightningElement {
    @track classroomId;
    name = '';

    handleNameChange(event) {
        this.classroomId = undefined;
        this.name = event.target.value;
    }
    insertClassroom() {
        const fields = {};
        fields[NAME_FIELD.fieldApiName] = this.name;
        const recordInput = { apiName: CLASSROOM_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then(classroom => {
                this.classroomId = classroom.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Classroom created',
                        variant: 'success',
                    }),
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
    }
}