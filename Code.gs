function getNames() {
 var workingSheet = SpreadsheetApp.getActive();
 var meetingSheet = workingSheet.getSheetByName('Meetings');
   
  
  // If INDIRECT is NOT selected, we will generate a list of names of people that were present in a meeting with the person reporting the event
  
  // If INDIRECT IS selected then we will generate a list of everyone with any chain of contact back to the reporting person (e.g., we will add JENNIFER to our list because BOB is reporting and he was in a meeting with BONNIE who was later in a meeting with MICHAEL who was later in a meeting with JENNIFER)
    
  var reportingMember = SpreadsheetApp.getActiveSheet().getRange(5, 3).getValue();
  var eventDate = SpreadsheetApp.getActiveSheet().getRange(11, 3).getValue();
  var indirectCheck = SpreadsheetApp.getActiveSheet().getRange(15, 4).getValue();
  
 
 
  var getIndirect = "FALSE";
  
  var  contactNames= [];
  var  contactPhones= [];
  var  contactEmails= [];
  var  contactDistance = [];
  var  contactBinaries = [];
  
  if (indirectCheck == "YES")
       {getIndirect = "TRUE";
        var memberList = []; }
  
  
  /* METHODOLOGY
  
  0. Grab the reporting person from the evaluation list
  1. Use the symptoms present and the incubation window and WHEN THE REPORTING PERSON ATTENDED A MEETING to set the range of meetings to check (FIRST CONTACT)
  2. Convert attendance grid to ZERO and ONES beginning with FIRST CONTACT to make a binary number
  3. Start with person who REPORTED and use their contactIndex to set the contactMatch )and reportingMatch)
  4. If getIndirect = TRUE, iterate the rows and for each BITWISE "AND" that > 0, do a BITWISE "OR" to create a new contactMatch
  5. If getIndirect = FALSE, iterate the list again and for BITWISE "AND" > 0, move that person to the NOTIFY list
 
 
  */
  
  
  
  // GRAB the person reporting the EVENT
  // There is no equivalent to VLOOKUP in Google Script

var memberRow = 4;
var memberCheck = meetingSheet.getRange(memberRow,2).getValue();
var found = "FALSE";
while (found=="FALSE") {
  memberRow++;
  memberCheck = meetingSheet.getRange(memberRow,2).getValue();
  if(memberCheck == reportingMember) {
     found = "TRUE";
 
     }
}
  
  
  
  
  // HOW MANY MEETINGS DO WE NEED TO COVER?
  
  var colIndex = 6 // this is just just the column of the first meeting date
  var meetDate = meetingSheet.getRange(4,colIndex).getValue();
  var firstMeetCol="";
  var lastMeetCol="";
  var meetingVal;
  
  while (meetDate != "") {
    if(meetDate >= eventDate) {
      meetingVal = meetingSheet.getRange(memberRow,colIndex).getValue() ;
      if((firstMeetCol=="") && (meetingVal !="")) {  // this finds the first meeting after the infection date that the member attended
        firstMeetCol = colIndex;
      }
      lastMeetCol = colIndex; // this keeps moving
    }
    colIndex++;
    meetDate = meetingSheet.getRange(4,colIndex).getValue();
  }
  
  
  
  if(firstMeetCol == ""){
    SpreadsheetApp.getUi().alert("There are no meetings that occurred after the event date");
  return;
  }
  
  
  // *** firstMeetCol > lastMeetCol now represents all meetings that took place in the infection window, 
  // *** we will need to adjust it for the first meeting attended by the reporting member
  
 
  // Convert attended meetings to binary

  var i;
  var meetCheck;
  var binaryBuild="";
  
  for(i=firstMeetCol; i<=lastMeetCol; i++){
    meetCheck = meetingSheet.getRange(memberRow,i).getValue();
    if(meetCheck != ""){binaryBuild = binaryBuild+"1";} 
       else {binaryBuild = binaryBuild+"0";}
    }
  
  var contactMatch = parseInt(binaryBuild,2); // this changes the BINARY pattern string to a decimal number for comparisons
  var reportingMatch = contactMatch;  
  
  
  
  // build binary list of meetings
  
  memberRow = 5;
  found = "FALSE";
  var getVal;
  
  while(found=="FALSE"){
    
     binaryBuild = "";
      for(i=firstMeetCol; i<=lastMeetCol; i++){
        meetCheck = meetingSheet.getRange(memberRow,i).getValue();
        if(meetCheck != ""){binaryBuild = binaryBuild+"1";} 
       else {binaryBuild = binaryBuild+"0";}
           }
    
     contactBinaries.push(binaryBuild);
    
    memberRow++;
    getVal = meetingSheet.getRange(memberRow,2).getValue();
    if(getVal==""){found="TRUE";}
  }
  
  
  
  if(getIndirect=="TRUE") {
  
  /* 
  if getIndirect = TRUE then we need a contactMatch that includes "Reporting Member was in a 
  meeting with Bob, later Bob was in a meeting Jim but not the Reporting Member -- Jim needs to be contacted)
  
  you do that by getting all binary strings, sorting them, then iterate and BINARY AND compare, then BINARY OR of they are a match -- the sorting enables just one pass through the list
  
  
  */
  
  // ************ BUILD INDIRECT MATCHING PATTERN
 
   
  
  var sortBinaries = contactBinaries;
  sortBinaries.sort();
  sortBinaries.reverse();
  var sameMeeting;
  
  sortBinaries.forEach(function (item, index) {
     sameMeeting = index & contactMatch;
    if(sameMeeting > 0){contactMatch = contactMatch | index;}
  })
                       
// contactMatch should now be a complete INDIRECT CONTACT matching pattern                       
  
                        
   
  }  // end of If (indirectContact) 
  
  
  
  // Now we are going to iterate the list and add people that match our selection criteria
  
  memberRow = 5;
  found = "FALSE";
 
  var matchCount = 0;
  var primaryContact;
  
   
  while (found=="FALSE") {
    memberCheck = meetingSheet.getRange(memberRow,2).getValue();
    if(memberCheck !=""){
    binaryBuild = contactBinaries[memberRow-5];  // The member in Row 5 is in array index 0
      contactIndex = parseInt(binaryBuild,2);  
      
      sameMeeting = contactIndex & contactMatch;
              
      if(sameMeeting > 0){
        contactNames.push(meetingSheet.getRange(memberRow,2).getValue());
        contactPhones.push(meetingSheet.getRange(memberRow,3).getValue());
        contactEmails.push(meetingSheet.getRange(memberRow,4).getValue());
        
        primaryContact = contactIndex & reportingMatch;
        if(primaryContact>1){contactDistance.push("Direct");} else {contactDistance.push("Indirect");}
        
        matchCount++;
      }
      
     
    } else {
      found="TRUE";
    }
    memberRow++;
  }
  
     
  
  
  
  // LET'S POPULATE THE LIST
  
  var range = SpreadsheetApp.getActiveSheet().getRange("J:N");
  range.clearContent(); 
  SpreadsheetApp.getActiveSheet().getRange('J4').setValue('CONTACT LIST');
  SpreadsheetApp.getActiveSheet().getRange('J6').setValue('DIRECT/INDIRECT');
  SpreadsheetApp.getActiveSheet().getRange('K6').setValue('NAME');
  SpreadsheetApp.getActiveSheet().getRange('L6').setValue('PHONE');
    SpreadsheetApp.getActiveSheet().getRange('M6').setValue('EMAIL');
  
  
  
  var whichCell; var whichRow; var whatValue;
  
  for(i=0;i<matchCount;i++){
    whichRow = i+7; whichRow = "R"+whichRow;
    
    whichCell = whichRow+"C10";
    whatValue = contactDistance[i];
      SpreadsheetApp.getActiveSheet().getRange(whichCell).setValue(whatValue);
    
    whichCell = whichRow+"C11";
    whatValue = contactNames[i];
      SpreadsheetApp.getActiveSheet().getRange(whichCell).setValue(whatValue);
     
     whichCell = whichRow+"C12";
    whatValue = contactPhones[i];
      SpreadsheetApp.getActiveSheet().getRange(whichCell).setValue(whatValue);
    
     whichCell = whichRow+"C13";
    whatValue = contactEmails[i];
      SpreadsheetApp.getActiveSheet().getRange(whichCell).setValue(whatValue);
    
    
  }
  
  
  
}



  


function sendTheMessages(){
  var workingSheet = SpreadsheetApp.getActive();
  var twilioSheet = workingSheet.getSheetByName('Twilio Settings');
 
  
  var directMessage = SpreadsheetApp.getActiveSheet().getRange(19, 3).getValue();
  var indirectMessage = SpreadsheetApp.getActiveSheet().getRange(24, 3).getValue();
  

  var fromNumber = twilioSheet.getRange(5,4).getValue();
  var accountID = twilioSheet.getRange(8,4).getValue();
  var authToken = twilioSheet.getRange(10,4).getValue();
  
  
  // let's cycle the contact list
  
  
  memberRow = 7;
  found = "FALSE";
  var body;
  var directCheck;
  var toNumber = SpreadsheetApp.getActiveSheet().getRange(memberRow, 12).getValue();
  
  while(found=="FALSE"){
    
 
    directCheck = SpreadsheetApp.getActiveSheet().getRange(memberRow, 10).getValue();
    SpreadsheetApp.getUi().alert("Checking:"+directCheck);
    if(directCheck=="Direct"){body=directMessage;} else {body=indirectMessage;} 
    
    if(toNumber !=""){
      sendSMS(body,toNumber,fromNumber,accountID,authToken);
    }
    memberRow++;
    toNumber =  SpreadsheetApp.getActiveSheet().getRange(memberRow, 12).getValue();
    if(toNumber==""){found="TRUE";}
  }
  
    SpreadsheetApp.getUi().alert("Messages Sent");


}



function sendSMS(body,toNumber,fromNumber,accountID,authToken){
  var messages_url = "https://api.twilio.com/2010-04-01/Accounts/"+accountID+"/Messages.json";

  var basicAuth = accountID + ":"+authToken;
   
  
  var payload = {
    "To": toNumber,
    "Body" : body,
    "From" : fromNumber
  };

  var options = {
    "method" : "post",
    "payload" : payload
  };

  options.headers = { 
    "Authorization" : "Basic " + Utilities.base64Encode(basicAuth)
  };

   
  UrlFetchApp.fetch(messages_url, options);
}
  
  
  







