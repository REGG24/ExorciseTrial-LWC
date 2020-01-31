//table an insert
import { LightningElement, wire, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

//update
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';


/* ******CLASSROOMS IMPORTS********* */
import getClassroomList from '@salesforce/apex/SchoolControllerLWC.getClassroomList';
import NAME_FIELD from '@salesforce/schema/Classroom__c.Name';
import numSTUDENTS_FIELD from '@salesforce/schema/Classroom__c.numStudents__c';
import numTEACHERS_FIELD from '@salesforce/schema/Classroom__c.numTeachers__c';
import ID_CLASS_FIELD from '@salesforce/schema/Classroom__c.Id';


const COLS_C = [
    { label: 'Classroom Name', fieldName: 'Name', editable: true },
    { label: 'Students', fieldName: 'numStudents__c', type: 'number' },
    { label: 'Teachers', fieldName: 'numTeachers__c', type: 'number' },
    { label: 'Max capacity', fieldName: 'max_capacity__c', type: 'number' }
];

import delSelectedClass from '@salesforce/apex/SchoolControllerLWC.deleteClassrooms';

export default class Recordeditform extends LightningElement {

    /* ******CLASSROOMS********* */

    //to update the classroom table from another javascript class (component)
    updateClassroomsTable() {
        this.connectedCallbackC();
        refreshApex(this.classroom);
    }

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
                this.template.querySelector('lightning-datatable').selectedRows = [];

                this.recordsCountC = 0;

                // refreshing table data using refresh apex
                return refreshApex(this.classroom);
            })
            .catch(error => {
                this.buttonLabelC = 'Delete';
                this.isTrueC = false;
                window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error while getting Classrooms, maybe you are trying to delete a Classroom that has a related Student or Teacher',
                        message: error.message,
                        variant: 'error'
                    }),
                );
                // Clearing selected row indexs 
                this.template.querySelector('lightning-datatable').selectedRows = [];

                this.recordsCountC = 0;

                // refreshing table data using refresh apex
                return refreshApex(this.classroom);
            });
    }


    //pagination
    dataC = [];
    @track pageC = 1;
    perpageC = 5;
    @track pagesC = [];
    set_sizeC = 5;

    renderedCallback() {
        //this method does not work becase the correct name is renderedCallback
        //and is above in the pagination of students and it is here just
        //to remember you that. Go and do whatever you were doing.
        this.renderButtonsC();
    }
    renderButtonsC = () => {
        this.template.querySelectorAll('button[data-name="classroom"').forEach((but) => {
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