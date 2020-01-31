trigger AvoidDeletionClassroom on Classroom__c (before delete) {
	for(Classroom__c s: Trigger.Old){
        if(s.numStudents__c > 0 && s.numTeachers__c > 0){
            //this works for LWC but not for visualforce
            s.addError('Cannot delete this classroom');
        }
    }
}