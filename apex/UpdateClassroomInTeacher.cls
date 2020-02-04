trigger UpdateClassroomInTeacher on Teacher__c (after update) {
	String OldId = '';
    for(Teacher__c s : Trigger.Old){
        if(s.Classroom__c != null){
            //getting the old id of the old classroom
       		OldId = s.Classroom__c; 
            System.debug('Old classroom id '+OldId);
        }else{
       		System.debug('NO classroom from the very begginning');
        }      
    }
       
    List<Classroom__c> classrooms = new List<Classroom__c>();
	String auxId = '';
    
    // Put the Id's and associated teacher values in the map
    Map<Id, Decimal> idsToUpdate = new Map<Id, Decimal>();
	
    
    for(Teacher__c s : Trigger.New){
        //****There is always a new classroom
        if(s.Classroom__c != null){                
            	//getting the new id of the classroom in order to get the current number of teachers
       			String classroom_id = s.Classroom__c;
            	System.debug('New classroom id'+classroom_id);
            	auxId = classroom_id;
            
            	//getting the number of teachers of the new classroom
       			List<Classroom__c> classroom = [select numTeachers__c from classroom__c where Id = :classroom_id];
       			Decimal numNew = classroom[0].numTeachers__c + 1; 
            
             if(classroom[0].numTeachers__c < 5){
            	
            	//****************There was no classroom and now there is
            	if(String.isEmpty(OldId)){                    
					idsToUpdate.put(s.Classroom__c, numNew);
                }
            	else{
                    //****************There was a classroom and now there is another
                    if(OldId != classroom_id){
                        //getting the number of teachers of the old classroom
       					classroom = [select numTeachers__c from classroom__c where Id = :OldId];
       					Decimal numOld = classroom[0].numTeachers__c - 1;
                    	idsToUpdate.put(s.Classroom__c, numNew);
                    	idsToUpdate.put(OldId, numOld);
                    }                	
                }                
             }//if(classroom[0].numTeachers__c < 5)
             else{ 
                  //this works for LWC but not for visualforce
                 s.addError('Cannot insert more than 5 Teachers to the same classroom');
             }
            
            
        }else{
            //****There is no a new classroom and there was an old            
            if(!String.isEmpty(OldId)){  
                //getting the number of teachers of the old classroom
       			List<Classroom__c> classroom = [select numTeachers__c from classroom__c where Id = :OldId];
       			Decimal numOld = classroom[0].numTeachers__c - 1;
            	idsToUpdate.put(OldId, numOld);
            }else{
                 //****There is no a new classroom and there was not an old classroom though
                System.debug('Hola soy cobian recargado');
            }
        }                 
    }//For
    
    
    List<SObject> sObjectsToUpdate = new List<SObject>();

	for (Id idToUpdate : idsToUpdate.keySet()) {
    	SObject o1 = idToUpdate.getSObjectType().newSObject(idToUpdate);
    	// Set the Name field dynamically
    	o1.put('numteachers__c', idsToUpdate.get(idToUpdate));
    	sObjectsToUpdate.add(o1);
	}

	update sObjectsToUpdate;
}