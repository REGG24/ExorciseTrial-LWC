import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Recordeditform extends LightningElement {
    @track studentId;
    handleSuccess(event) {
        this.contactId = event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Student created',
                variant: 'success',
            }),
        );
    }

}