trigger InitializeClassroom on Classroom__c (after insert) {
    
    List<Classroom__c> classrooms = new List<Classroom__c>(); 
    for(Classroom__c c : Trigger.New){
        classrooms.add(
       		new Classroom__c(
                numStudents__c = 0,
                numTeachers__c = 0,
                max_capacity__c = 11,
                Id = c.Id
            )
      	 );  
    }
    
    //Finally this actualices the field
    Database.UpsertResult[] resultsAcc = Database.upsert( classrooms, Classroom__c.Fields.Id );
   
}