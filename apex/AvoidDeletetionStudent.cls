trigger AvoidDeletetionStudent on Student__c (before delete) {
    System.debug('trigger to delete student');
    for(Student__c s: Trigger.Old){
        System.debug('inside for');
        if(s.Classroom__c != null){
            System.debug('the student has a classroom');
            //this works for LWC but not for visualforce
            s.addError('Cannot delete a Student that has a classroom related');
        }
    }
}