trigger IncreaseTeacherInClassroom on Teacher__c (before insert) {   
    System.debug('Beggining trigger');
        
    List<Classroom__c> classrooms = new List<Classroom__c>();
	String auxId = '';
    
    for(Teacher__c s : Trigger.New){
        if(s.Classroom__c != null){
            	//getting the new id of the classroom in order to get the current number of students
       			String classroom_id = s.Classroom__c;
            	System.debug('Id classroom: '+classroom_id);
                auxId = classroom_id;
       			//getting the current number of students
       			List<Classroom__c> classroom = [select numTeachers__c from classroom__c where Id = :classroom_id];
       			Decimal num = classroom[0].numTeachers__c;
        		System.debug('num: '+num);
            	if(num < 5){
                	classrooms.add(
       					new Classroom__c(
                			numTeachers__c = num + 1,
                			Id = s.Classroom__c
            			)
      	 			);
                }else{
                    //this works for LWC but not for visualforce
                   s.addError('Cannot insert more than 5 teachers to the same classroom');
                }
        }
            
    }
    
    //Finally this ensures if the classroom id exists then it actualice the fields
    if(!String.isEmpty(auxId)){
        Database.UpsertResult[] resultsAcc = Database.upsert( classrooms, Classroom__c.Fields.Id );
    }     
    
}