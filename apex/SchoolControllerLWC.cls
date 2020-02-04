public class SchoolControllerLWC {
    
    /* ***STUDENTS*** */
	@AuraEnabled(cacheable=true)    
    public static List<Student__c> getStudentList(String searchFilter) {
        System.debug('searchFilter before everything: '+searchFilter);
        
        if(String.isBlank(searchFilter) || searchFilter == null || searchFilter == '' || searchFilter == ' '){
            return [SELECT Id, Name, Last_Name__c, Classroom__c, Classroom__r.Name FROM Student__c];
        }else{
            searchFilter += '%';
            System.debug('searchFilter: '+searchFilter);
            return [SELECT Id, Name, Last_Name__c, Classroom__c, Classroom__r.Name FROM Student__c WHERE NAME LIKE :searchFilter];
        }
        
        
    }
    
    @AuraEnabled
    public static void deleteStudents(list<Id> lstConIds){
        try {
            list<Student__c> lstConsToDelete = new list<Student__c>();
            System.debug('lstConIds ====> '+lstConIds);
            for(Id idCon : lstConIds) {
                    lstConsToDelete.add(new Student__c(Id = idCon));                                           
            }
            if(!lstConsToDelete.isEmpty()) {
                delete lstConsToDelete;
            }
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
    
    /* ***CLASSROOMS*** */
    @AuraEnabled(cacheable=true)    
    public static List<Classroom__c> getClassroomList(string searchKey) {
        //return [SELECT Id, Name, numStudents__c, numTeachers__c FROM Classroom__c];
        System.debug('searchKey before everything: '+searchKey);
        if(String.isBlank(searchKey) || searchKey == null || searchKey == '' || searchKey == ' '){
            return [SELECT Id, Name, numStudents__c, numTeachers__c, max_capacity__c FROM Classroom__c];
        }else{
            searchKey += '%';
            System.debug('searchKey: '+searchKey);
            return [SELECT Id, Name, numStudents__c, numTeachers__c,max_capacity__c FROM Classroom__c WHERE NAME LIKE :searchKey];
        }
    }
    
    @AuraEnabled
    public static void deleteClassrooms(list<Id> lstConIds){
        try {
            list<Classroom__c> lstConsToDelete = new list<Classroom__c>();
            System.debug('lstConIds ====> '+lstConIds);
            for(Id idCon : lstConIds) {
                lstConsToDelete.add(new Classroom__c(Id = idCon));
            }
            if(!lstConsToDelete.isEmpty()) {
                delete lstConsToDelete;
            }
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
   
    
    
    /* ***TEACHERS*** */
	@AuraEnabled(cacheable=true)    
    public static List<Teacher__c> getTeacherList(String searchFilter) {
        System.debug('searchFilter before everything: '+searchFilter);
        
        if(String.isBlank(searchFilter) || searchFilter == null || searchFilter == '' || searchFilter == ' '){
            return [SELECT Id, Name, Last_Name__c, Classroom__c, Classroom__r.Name FROM Teacher__c];
        }else{
            searchFilter += '%';
            System.debug('searchFilter: '+searchFilter);
            return [SELECT Id, Name, Last_Name__c, Classroom__c, Classroom__r.Name FROM Teacher__c WHERE NAME LIKE :searchFilter];
        }                
    }
    
    @AuraEnabled
    public static void deleteTeachers(list<Id> lstConIds){
        try {
            list<Teacher__c> lstConsToDelete = new list<Teacher__c>();
            System.debug('lstConIds ====> '+lstConIds);
            for(Id idCon : lstConIds) {
                lstConsToDelete.add(new Teacher__c(Id = idCon));
            }
            if(!lstConsToDelete.isEmpty()) {
                delete lstConsToDelete;
            }
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
    
    
    @AuraEnabled(cacheable=true)  
   public static List<Account> getLookupSerachRecords(String searchString, String selectedSObject, Integer recordLimit) {  
     if(searchString != null && searchString != ''){  
       String query = 'select Name, Id from ' + selectedSObject;  
         query += ' where Name like \'%'+ searchString +'%\' ';  
       query+= ' limit ' + recordLimit;  
       return Database.query(query);  
     }  
     return null;  
   }  
    
}