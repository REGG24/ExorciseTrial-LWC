trigger AvoidDeletionTeacher on Teacher__c (before delete) {
    for(Teacher__c s: Trigger.Old){
        if(s.Classroom__c != null){
            //this works for LWC but not for visualforce
            s.addError('Cannot delete a Teacher that has a classroom related');
        }
    }
}