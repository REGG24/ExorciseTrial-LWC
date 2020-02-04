//table an insert
import { LightningElement, wire, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

//update
import getTeacherList from '@salesforce/apex/SchoolControllerLWC.getTeacherList';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import FIRSTNAME_FIELD from '@salesforce/schema/Teacher__c.Name';
import LASTNAME_FIELD from '@salesforce/schema/Teacher__c.Last_Name__c';
import CLASSROOM_FIELD from '@salesforce/schema/Teacher__c.Classroom__c';
import ID_FIELD from '@salesforce/schema/Teacher__c.Id';

import delSelectedStus from '@salesforce/apex/SchoolControllerLWC.deleteTeachers';

//table
const COLS = [
    { label: 'First Name', fieldName: 'Name', editable: true },
    { label: 'Last Name', fieldName: 'Last_Name__c', editable: true },
    { label: 'Classroom', fieldName: 'Classroom__c', editable: true, type: LightningElement },
    { label: 'Classroom Edit', type: 'fileUpload', editable: true }//added to use lookup
];

export default class Recordeditform extends LightningElement {

    //search   
    @api searchFilter = '';
    @wire(getTeacherList, { searchFilter: '$searchFilter' })
    getTeacherList(result) {
        this.teacher = result;
        if (result.data) {
            this.data = result.data;

            //added to put the name of the classroom
            let currentData = [];
            result.data.forEach((row) => {
                let rowData = {};
                rowData.Id = row.Id;
                rowData.Name = row.Name;
                rowData.Last_Name__c = row.Last_Name__c;
                // Student related data
                if (row.Classroom__r) {
                    rowData.Classroom__c = row.Classroom__r.Name;
                } else {
                    rowData.Classroom__c = null;
                }
                currentData.push(rowData);
            });
            this.data = currentData;


        } else if (result.error) {
            this.error = result.error;
        }
    }

    handleKeyChange(event) {
        this.searchFilter = event.target.value;
        return refreshApex(this.teacher);
    }

    //insert
    @track teacherId;

    //table update
    @track error;
    @track columns = COLS;
    @track draftValues = [];

    @track teacher;

    //delete
    @track buttonLabel = 'Delete';
    @track isTrue = false;
    @track recordsCount = 0
    // non-reactive variables(delete)
    selectedRecords = [];



    //insert
    handleSuccess(event) {
        this.teacherId = event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Teacher created',
                variant: 'success',
            }),
        );

        //update the classroom table that is in another component
        this.updateClassroomsTable();
        // Display fresh data in the datatable and refresh pagination
        return refreshApex(this.teacher, this.setPages(this.data));
    }

    updateClassroomsTable() {
        const selectedEvent = new CustomEvent('updateclassroomst', {});
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }

    //table(update)

    //to update the classroom
    @track selectedClassroomRecord;
    // Event bubbles to grandparent and being handled here  
    handlelookupselectclassroom(event) {
        this.selectedClassroomRecord = event.detail;
    }

    handleSave(event) {

        const fields = {};
        fields[ID_FIELD.fieldApiName] = event.detail.draftValues[0].Id;
        fields[FIRSTNAME_FIELD.fieldApiName] = event.detail.draftValues[0].Name;
        fields[LASTNAME_FIELD.fieldApiName] = event.detail.draftValues[0].Last_Name__c;
        //fields[CLASSROOM_FIELD.fieldApiName] = event.detail.draftValues[0].Classroom__c;

        if (this.selectedClassroomRecord) {
            let Id = this.selectedClassroomRecord.Id;
            window.console.log("Id classroom: " + Id);
            fields[CLASSROOM_FIELD.fieldApiName] = Id;
        }

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Teacher updated',
                        variant: 'success'
                    })
                );
                // Clear all draft values
                this.draftValues = [];

                //update the classroom table that is in another component
                this.updateClassroomsTable();

                // Display fresh data in the datatable
                return refreshApex(this.teacher);
            }).catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating record, maybe you are trying to add a teacher in a classroom that has 5 students',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }


    // Getting selected rows 
    getSelectedRecords(event) {
        // getting selected rows
        const selectedRows = event.detail.selectedRows;

        this.recordsCount = event.detail.selectedRows.length;

        // this set elements the duplicates if any
        let conIds = new Set();

        // getting selected record id
        for (let i = 0; i < selectedRows.length; i++) {
            conIds.add(selectedRows[i].Id);
        }

        // coverting to array
        this.selectedRecords = Array.from(conIds);

        window.console.log('selectedRecords ====> ' + this.selectedRecords);
    }


    // delete records process function
    deleteTeachers() {
        if (this.selectedRecords) {
            // setting values to reactive variables
            this.buttonLabel = 'Deleting....';
            this.isTrue = true;

            // calling apex class to delete selected records.
            this.deleteStus();
        }
    }


    deleteStus() {
        delSelectedStus({ lstConIds: this.selectedRecords })
            .then(result => {
                window.console.log('result ====> ' + result);

                this.buttonLabel = 'Delete';
                this.isTrue = false;

                // showing success message
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.recordsCount + ' Teachers are deleted.',
                        variant: 'success'
                    }),
                );

                // Clearing selected row indexs 
                this.template.querySelector('lightning-datatable').selectedRows = [];

                this.recordsCount = 0;

                // refreshing table data using refresh apex
                return refreshApex(this.teacher);
            })
            .catch(error => {
                this.buttonLabel = 'Delete';
                this.isTrue = false;

                window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error while getting Teachers, maybe you are trying to delete a teacher that has a related classroom',
                        message: error.message,
                        variant: 'error'
                    }),
                );

                // Clearing selected row indexs 
                this.template.querySelector('lightning-datatable').selectedRows = [];

                this.recordsCount = 0;

                // refreshing table data using refresh apex
                return refreshApex(this.teacher);
            });
    }


    //pagination
    data = [];
    @track page = 1;
    perpage = 5;
    @track pages = [];
    set_size = 5;

    renderedCallback() {
        this.renderButtons();
    }
    renderButtons = () => {
        this.template.querySelectorAll('button[data-name="student"]').forEach((but) => {
            but.style.backgroundColor = this.page === parseInt(but.dataset.id, 10) ? 'green' : 'white';
            but.style.color = this.page === parseInt(but.dataset.id, 10) ? 'white' : 'black';
        });
    }
    get pagesList() {
        let pages = Math.ceil(this.data.length / this.perpage);
        let pages_list = [];
        for (let i = 0; i < pages; i++) {
            pages_list.push(i + 1);
        }
        return pages_list;
    }
    async connectedCallback() {
        this.data = await getTeacherList();
        this.setPages(this.data);
    }
    pageData = () => {
        let page = this.page;
        let perpage = this.perpage;
        let startIndex = (page * perpage) - perpage;
        let endIndex = (page * perpage);
        return this.data.slice(startIndex, endIndex);
    }
    setPages = (data) => {
        let numberOfPages = Math.ceil(data.length / this.perpage);
        for (let index = 1; index <= numberOfPages; index++) {
            this.pages.push(index);
        }
    }
    get hasPrev() {
        return this.page > 1;
    }
    get hasNext() {
        let pages = Math.ceil(this.data.length / this.perpage);
        return this.page < pages;
    }
    onNext = () => {
        ++this.page;
    }
    onPrev = () => {
        --this.page;
    }
    onPageClick = (e) => {
        this.page = parseInt(e.target.dataset.id, 10);
    }
    get currentPageData() {
        return this.pageData();
    }

}