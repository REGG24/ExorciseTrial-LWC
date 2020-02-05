/* ******STUDENTS IMPORTS********* */
//table an insert
import { LightningElement, wire, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

//update
import getStudentList from '@salesforce/apex/SchoolControllerLWC.getStudentList';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import FIRSTNAME_FIELD from '@salesforce/schema/Student__c.Name';
import LASTNAME_FIELD from '@salesforce/schema/Student__c.Last_Name__c';
import CLASSROOM_FIELD from '@salesforce/schema/Student__c.Classroom__c';
//import CLASSROOM_FIELD_NAME from '@salesforce/schema/Student__c.Classroom__r.Name';

import ID_FIELD from '@salesforce/schema/Student__c.Id';

import delSelectedStus from '@salesforce/apex/SchoolControllerLWC.deleteStudents';

//table
const COLS = [
    { label: 'First Name', fieldName: 'Name', editable: true },
    { label: 'Last Name', fieldName: 'Last_Name__c', editable: true },
    { label: 'Classroom Name', fieldName: 'Classroom__c', editable: true },
    { label: 'Classroom Edit', type: 'fileUpload', editable: true }//added to use lookup
];



export default class Recordeditform extends LightningElement {

    /* ******STUDENTS********* */
    //search   
    @api searchFilter = '';
    @wire(getStudentList, { searchFilter: '$searchFilter' })
    getStudentList(result) {
        this.student = result;
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
        return refreshApex(this.student);
    }

    //insert
    @track studentId;

    //table update
    @track error;
    @track columns = COLS;
    @track draftValues = [];


    @track student;

    //delete
    @track buttonLabel = 'Delete';
    @track isTrue = false;
    @track recordsCount = 0
    // non-reactive variables(delete)
    selectedRecords = [];




    //insert
    handleSuccess(event) {
        this.studentId = event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Student created',
                variant: 'success',
            }),
        );

        //update the classroom table that is in another component
        this.updateClassroomsTable();
        // Display fresh data in the datatable and refresh pagination
        return refreshApex(this.student, this.setPages(this.data));
    }

    updateClassroomsTable() {
        const selectedEvent = new CustomEvent('updateclassroomst', {});
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }

    //table(update)

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

        const classroom_name = event.detail.draftValues[0].Classroom__c;

        window.console.log('classroom_name: ' + classroom_name);

        //if the classroom edit is  not empty
        if (this.selectedClassroomRecord) {
            let Id = this.selectedClassroomRecord.Id;
            window.console.log("Id classroom: " + Id);
            fields[CLASSROOM_FIELD.fieldApiName] = Id;
            this.selectedClassroomRecord = null;
        }
        //if the classroom name is empty
        else if (!classroom_name) {
            fields[CLASSROOM_FIELD.fieldApiName] = null;
        }




        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Student updated',
                        variant: 'success'
                    })
                );
                // Clear all draft values
                this.draftValues = [];

                //update the classroom table that is in another component
                this.updateClassroomsTable();

                // Display fresh data in the datatable
                return refreshApex(this.student);
            }).catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating record, maybe you are trying to add a student in a classroom that has 10 students',
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
    deleteStudents() {
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
                        message: this.recordsCount + ' Students are deleted.',
                        variant: 'success'
                    }),
                );

                // Clearing selected row indexs 
                //this.template.querySelector('lightning-datatable').selectedRows = [];
                this.template.querySelector('c-poc-lightning-datatable').selectedRows = [];
                this.recordsCount = 0;

                // refreshing table data using refresh apex
                return refreshApex(this.student);
            })
            .catch(error => {
                this.buttonLabel = 'Delete';
                this.isTrue = false;

                window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error while getting Students, maybe you are trying to delete a student that has a related classroom',
                        message: error.message,
                        variant: 'error'
                    }),
                );


                // Clearing selected row indexs 
                //this.template.querySelector('lightning-datatable').selectedRows = [];
                this.template.querySelector('c-poc-lightning-datatable').selectedRows = [];

                this.recordsCount = 0;

                // refreshing table data using refresh apex
                return refreshApex(this.student);

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
        /*
        let mid = Math.floor(this.set_size / 2) + 1;
        if (this.page > mid) {
            return this.pages.slice(this.page - mid, this.page + mid - 1);
        }
        return this.pages.slice(0, this.set_size);
        */
        //my idea:
        let pages = Math.ceil(this.data.length / this.perpage);
        let pages_list = [];
        for (let i = 0; i < pages; i++) {
            pages_list.push(i + 1);
        }
        return pages_list;
    }
    async connectedCallback() {
        this.data = await getStudentList();
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
        //window.console.log("data.length: " + data.length);
        //window.console.log("numberOfPages: " + numberOfPages);
        for (let index = 1; index <= numberOfPages; index++) {
            this.pages.push(index);
        }
        //window.console.log("See the content of pages");
        //for (let index = 0; index < this.pages.length; index++) {
        //    window.console.log("page 0: " + this.pages[index]);
        //}
    }
    get hasPrev() {
        return this.page > 1;
    }
    get hasNext() {
        //window.console.log("this.page: " + this.page);
        //window.console.log("this.pages.length: " + this.pages.length);
        //return this.page < this.pages.length  original
        //window.console.log("data.length: " + this.data.length);
        let pages = Math.ceil(this.data.length / this.perpage);
        //window.console.log("pages length (mio): " + pages);
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