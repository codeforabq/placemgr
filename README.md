# placemgr

This project is still under construction.

Place Manager is a generalized tool that maps locations of a given type of place and provides updated 
information about that place.
It allows the user to quickly filter the data, sort it by the nearest locations, or find ones with the 
best estimated elements.  
View the issue tracker for features still under construction.

Based on ABQVotes API

Developers using this tool supply the following:
- name and title to display
- database of branch information (static)
- database for dynamic information
- list of elements to track and display (dynamic)

Goals:
- ability to show places that provide a given service as well as greyed-out branches that don't
- use generic variables in developer-provided (ini or text) file to name the variables for display
- have a mechanism to keep the info / app up-to-date.

Notes / suggestions:
To keep the formatting even, 
- keep tabs to 4 spaces and as tabs (not spaces)
- put opening braces on the function line, closing braces on a separate line
To ease navigation,
- mark areas under work with "todo" and a comment about what is needed
- initials/names can be used to mark areas of interest during development, but should be removed before beta testing

Development Plan:
1) setup:
- get access to placemgr on github and slack; pull project 
- use chrome and its development tools
- use your favorite editor
- open and run index.html
- confirm environment by making a minor change (e.g., to the title) and run it
- track functionality via console log
2) genericize
- strip out unused code and comments
- add comments as needed (code that is auto-generated from dev tools should be noted as such, and a summary added)
- move needed elements from app.css to placemgr.css (local elements instead of via internet speeds app loading); delete app.css
- modify "vote" and "election" names to PlaceMgr names
- mofify "wait_time" and election dates to dynInfo1, dynInfo2, etc
- separate script file into files for (1) main window functions (2) error / msg handling (3) other
- create and link in test database; uncomment ajax functions to read the data
- create placemgr_info.xml file for developer-provided information (see above)
- write functions to read xml file and use the information (issue: XMLHttpRequest error)
- include a form of auto-trigger to notify users/developers when a date is past (e.g., voting is closed)
3) document for developers: what to provide, how to use, suggested maintenance plan
4) alpha test with ABQvotes 2016
5) beta test with Stop Senior Hunger and/or United Way
- determine who are the expected users of app; determine what information is static, dynamic (and bounds)

Elements:
README.md - this file; project info
LICENSE - the license to use this software
index.htlm - home page
placemgr_info.xml - file of developer-provided app-specific information 
placemgr.css - stylesheet
placemgr_windows.js - scripts / functions for webpage windows; called by index.html
placemgr_msgs.js - scripts / functions for handling errors and messages; called by index.html
placemgr_filter.js - scripts / functions to handle filters
placemgr_info.js - scripts / functions to read and use placemgr_info.xml
placemgr_getDynInfo.php - functions to get dynamic info from database
placemgr_addDynInfo.php - functions to add dynamic info to database
data/placemgr.json - developer-provided database / list of place-specific static information (e.g., name, address, hours)
