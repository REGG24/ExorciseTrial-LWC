import { LightningElement, api } from 'lwc';
export default class LookupWrapperParent extends LightningElement {
    @api selectedClassroomRecord;
    // Event bubbles to grandparent and being handled here - Account  
    handlelookupselectaccount(event) {
        this.selectedClassroomRecord = event.detail;
    }

}  