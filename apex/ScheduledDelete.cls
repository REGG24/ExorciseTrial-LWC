global class ScheduledDelete implements Schedulable {
  
  global void execute(SchedulableContext sc) {
      		boolean success = true;
			List<Student__c> student = [select id from Student__c where Classroom__c = null];        
        	if(student != null)
        	{
            	try{
                	delete student;                                  
            	}
            	catch(DmlException ex){
                	ApexPages.addMessages(ex);
                    success = false;
            	}
        	}
      
 
			List<Teacher__c> teacher = [select id from Teacher__c where Classroom__c = null];        
        	if(teacher != null)
        	{
            	try{
                	delete teacher;                                  
            	}
            	catch(DmlException ex){
                	ApexPages.addMessages(ex);
                    success = false;
            	}
        	}
      
      		List<Classroom__c> classroom = [select id from Classroom__c where numStudents__c = 0 and numTeachers__c = 0];        
        	if(classroom != null)
        	{
            	try{
                	delete classroom;                                  
            	}
            	catch(DmlException ex){
                	ApexPages.addMessages(ex);
                    success = false;
            	}
        	}
           		           	  
      // Create an email message object
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        String[] toAddresses = new String[] {'rubenesau.gg@gmail.com'};
        mail.setToAddresses(toAddresses);
        mail.setSubject('scheduled delete');
      
        mail.setPlainTextBody('Congratulations, you were able to make the complete scheduled funcion');
        
      	Messaging.SendEmailResult[] results = Messaging.sendEmail(
                                 new Messaging.SingleEmailMessage[] { mail });
      
      
      
      /*
      String hour = String.valueOf(9);
      String min = String.valueOf(50);
      String ss = String.valueOf(15); 
      String nextFireTime = ss + ' ' + min + ' ' + hour + ' * * ?';
      System.debug('-----------nextFireTime---------' + nextFireTime);
      ScheduledDelete s = new ScheduledDelete();
      System.schedule('Job Started At ' + String.valueOf(Datetime.now()), nextFireTime, s);
*/
  }

    /*
public static testMethod void testschedule() {

        Test.StartTest();

        ScheduledApexForBulkDelete  sh1 = new ScheduledApexForBulkDelete();
        String sch = '0 0 23 * * ?';
        System.assert(sch == '0 0 23 * * ?');
        system.schedule('Test Territory Check', sch, sh1);
        Test.stopTest();

    }*/
}