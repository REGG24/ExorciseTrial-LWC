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
import ID_FIELD from '@salesforce/schema/Student__c.Id';

import delSelectedStus from '@salesforce/apex/SchoolControllerLWC.deleteStudents';

//table
const COLS = [
    { label: 'First Name', fieldName: 'Name', editable: true },
    { label: 'Last Name', fieldName: 'Last_Name__c', editable: true },
    { label: 'Classroom', fieldName: 'Classroom__c', editable: true, type: LightningElement }
];


/* ******CLASSROOMS IMPORTS********* */
import getClassroomList from '@salesforce/apex/SchoolControllerLWC.getClassroomList';
import NAME_FIELD from '@salesforce/schema/Classroom__c.Name';
import numSTUDENTS_FIELD from '@salesforce/schema/Classroom__c.numStudents__c';
import numTEACHERS_FIELD from '@salesforce/schema/Classroom__c.numTeachers__c';
import ID_CLASS_FIELD from '@salesforce/schema/Classroom__c.Id';


const COLS_C = [
    { label: 'Classroom Name', fieldName: 'Name', editable: true },
    { label: 'Students', fieldName: 'numStudents__c', type: 'number' },
    { label: 'Teachers', fieldName: 'numTeachers__c', type: 'number' }
];

import delSelectedClass from '@salesforce/apex/SchoolControllerLWC.deleteClassrooms';

export default class Recordeditform extends LightningElement {

    /* ******STUDENTS********* */
    //search   
    @api searchFilter = '';
    @wire(getStudentList, { searchFilter: '$searchFilter' })
    getStudentList(result) {
        this.student = result;
        if (result.data) {
            this.data = result.data;
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

    @wire(getStudentList)
    student;

    //delete
    @track buttonLabel = 'Delete';
    @track isTrue = false;
    @track recordsCount = 0
    // non-reactive variables(delete)
    selectedRecords = [];
    refreshTable;



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


        this.refresh_numStudents();
        // Display fresh data in the datatable and refresh pagination
        return refreshApex(this.student, this.setPages(this.data));
    }

    refresh_numStudents() {
        return refreshApex(this.classroom);
    }

    //table(update)
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
                        message: 'Student updated',
                        variant: 'success'
                    })
                );
                // Clear all draft values
                this.draftValues = [];

                // Display fresh data in the datatable
                return refreshApex(this.student);
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

    //delete
    // retrieving the data using wire service
    @wire(getStudentList)
    students(result) {
        this.refreshTable = result;
        if (result.data) {
            this.data = result.data;
            this.error = undefined;

        } else if (result.error) {
            this.error = result.error;
            this.data = undefined;
        }
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
                this.template.querySelector('lightning-datatable').selectedRows = [];

                this.recordsCount = 0;

                // refreshing table data using refresh apex
                return refreshApex(this.refreshTable);
            })
            .catch(error => {
                window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error while getting Students',
                        message: error.message,
                        variant: 'error'
                    }),
                );
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
        this.renderButtonsC();
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












    /* ******CLASSROOMS********* */

    //search   
    @api searchFilterC = '';
    @wire(getClassroomList, { searchKey: '$searchFilterC' })
    getClassroomList(result) {
        this.classroom = result;
        if (result.data) {
            this.dataC = result.data;
        } else if (result.error) {
            this.errorC = result.error;
        }
    }

    handleKeyChangeC(event) {
        this.searchFilterC = event.target.value;
        return refreshApex(this.result);
    }




    //insert
    @track classroomId;

    //table update
    @track errorC;
    @track columnsC = COLS_C;
    @track draftValuesC = [];

    @wire(getClassroomList)
    classroom;



    //delete
    @track buttonLabelC = 'Delete';
    @track isTrueC = false;
    @track recordsCountC = 0
    // non-reactive variables(delete)
    selectedRecordsC = [];
    refreshTableC;



    //insert
    handleSuccessC(event) {
        this.classroomId = event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Classroom created',
                variant: 'success',
            }),
        );

        // Display fresh data in the datatable and refresh pagination
        return refreshApex(this.classroom, this.setPagesC(this.dataC));
    }

    //table(update)
    handleSaveC(event) {
        window.console.log('Trying to update classrooms');
        const fields = {};
        fields[ID_CLASS_FIELD.fieldApiName] = event.detail.draftValues[0].Id;
        fields[NAME_FIELD.fieldApiName] = event.detail.draftValues[0].Name;
        fields[numSTUDENTS_FIELD.fieldApiName] = event.detail.draftValues[0].numStudents__c;
        fields[numTEACHERS_FIELD.fieldApiName] = event.detail.draftValues[0].numTeachers__c;

        const recordInput = { fields };

        updateRecord(recordInput)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Classroom updated',
                        variant: 'success'
                    })
                );
                // Clear all draft values
                this.draftValuesC = [];

                // Display fresh data in the datatable
                return refreshApex(this.classroom);
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

    //delete
    // retrieving the data using wire service
    @wire(getClassroomList)
    classrooms(result) {
        this.refreshTableC = result;
        if (result.data) {
            this.dataC = result.data;
            this.errorC = undefined;

        } else if (result.error) {
            this.errorC = result.error;
            this.dataC = undefined;
        }
    }


    // Getting selected rows 
    getSelectedRecordsC(event) {
        // getting selected rows
        const selectedRows = event.detail.selectedRows;

        this.recordsCountC = event.detail.selectedRows.length;

        // this set elements the duplicates if any
        let conIds = new Set();

        // getting selected record id
        for (let i = 0; i < selectedRows.length; i++) {
            conIds.add(selectedRows[i].Id);
        }

        // coverting to array
        this.selectedRecordsC = Array.from(conIds);

        window.console.log('selectedRecords ====> ' + this.selectedRecordsC);
    }


    // delete records process function
    deleteClassrooms() {
        if (this.selectedRecordsC) {
            // setting values to reactive variables
            this.buttonLabelC = 'Deleting....';
            this.isTrueC = true;

            // calling apex class to delete selected records.
            this.deleteClass();
        }
    }


    deleteClass() {
        delSelectedClass({ lstConIds: this.selectedRecordsC })
            .then(result => {
                window.console.log('result ====> ' + result);

                this.buttonLabelC = 'Delete';
                this.isTrueC = false;

                // showing success message
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.recordsCountC + ' Classrooms are deleted.',
                        variant: 'success'
                    }),
                );

                // Clearing selected row indexs 
                this.template.querySelector('lightning-datatable').selectedRowsC = [];

                this.recordsCountC = 0;

                // refreshing table data using refresh apex
                return refreshApex(this.refreshTableC);
            })
            .catch(error => {
                window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error while getting Classrooms',
                        message: error.message,
                        variant: 'error'
                    }),
                );
            });
    }


    //pagination
    dataC = [];
    @track pageC = 1;
    perpageC = 5;
    @track pagesC = [];
    set_sizeC = 5;

    renderedCallbackC() {
        //this method does not work becase the correct name is renderedCallback
        //and is above in the pagination of students and it is here just
        //to remember you that. Go and do whatever you were doing.
        this.renderButtonsC();
    }
    renderButtonsC = () => {
        this.template.querySelectorAll('button[data-name="classroom"]').forEach((but) => {
            but.style.backgroundColor = this.pageC === parseInt(but.dataset.id, 10) ? 'dodgerblue' : 'white';
            but.style.color = this.pageC === parseInt(but.dataset.id, 10) ? 'white' : 'black';
        });
    }
    get pagesListC() {
        let pages = Math.ceil(this.dataC.length / this.perpageC);
        let pages_list = [];
        for (let i = 0; i < pages; i++) {
            pages_list.push(i + 1);
        }
        return pages_list;
    }
    async connectedCallbackC() {
        this.dataC = await getClassroomList();
        this.setPagesC(this.dataC);
    }
    pageDataC = () => {
        let page = this.pageC;
        let perpage = this.perpageC;
        let startIndex = (page * perpage) - perpage;
        let endIndex = (page * perpage);
        return this.dataC.slice(startIndex, endIndex);
    }
    setPagesC = (data) => {
        let numberOfPages = Math.ceil(data.length / this.perpageC);
        for (let index = 1; index <= numberOfPages; index++) {
            this.pagesC.push(index);
        }
    }
    get hasPrevC() {
        return this.pageC > 1;
    }
    get hasNextC() {
        let pages = Math.ceil(this.dataC.length / this.perpageC);
        return this.pageC < pages;
    }
    onNextC = () => {
        ++this.pageC;
    }
    onPrevC = () => {
        --this.pageC;
    }
    onPageClickC = (e) => {
        this.pageC = parseInt(e.target.dataset.id, 10);
    }
    get currentPageDataC() {
        return this.pageDataC();
    }






}