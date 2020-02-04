import { LightningElement, track, api, wire } from 'lwc';
import getLookupSerachRecords from '@salesforce/apex/SchoolControllerLWC.getLookupSerachRecords';
export default class LookupSearch extends LightningElement {
    // Tracked properties  
    @track records;
    @track noRecordsFlag = false;
    @track showoptions = true;
    @track searchString = '';
    @track selectedName;
    // API properties  
    @api selectedsobject;
    @api recordlimit;
    @api label;
    // Wire method to function, which accepts the Search String, Dynamic SObject, Record Limit, Search Field  
    @wire(getLookupSerachRecords, { searchString: '$searchString', selectedSObject: '$selectedsobject', recordLimit: '$recordlimit' })
    wiredContacts({ error, data }) {
        this.noRecordsFlag = 0;
        if (data) {
            this.records = data;
            this.error = undefined;
            this.noRecordsFlag = this.records.length === 0 ? true : false;
        } else if (error) {
            this.error = error;
            this.records = undefined;
        }
    }
    // handle event called lookupselect  
    handlelookupselect(event) {
        this.selectedName = event.detail.Name;
        this.showoptions = false;
    }
    // key change on the text field  
    handleKeyChange(event) {
        this.showoptions = true;
        this.searchString = event.target.value;
    }
}  