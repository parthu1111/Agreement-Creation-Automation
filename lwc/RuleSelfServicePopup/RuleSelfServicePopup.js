import { LightningElement, track, api } from 'lwc';
import LightningModal from 'lightning/modal';
import getMergeFields from '@salesforce/apex/SelfServiceruleRuleHelperClass.getMergeFields';
import insertOrUpdate from '@salesforce/apex/SelfServiceruleRuleHelperClass.insertOrUpdate';
import getruleTemplateId from '@salesforce/apex/SelfServiceruleRuleHelperClass.getruleTemplateId';

export default class ruleSelfServicePopup extends LightningModal {

    @api agreementId;
    //for edit functionallity and it's store the id of agreement rule service object
    @api ruleId;
    @track mergeFields = null;
    @track loadingComponant = false;
    @api rules = []
    @track selectedrule;
    @track newSelfServiceRecord = {};
    @api type;
    @api label;
    @track readOnly = true;
    @track error;
    selectedruleName=null;

    async connectedCallback() {
        try {
            console.log("ruleSelfServicePopup connected callback v2");
            console.log("rules");
            console.log(this.rules);
            if (this.type === 'edit') {
                console.log('set value');
                this.readOnly = false;
            }
            if (this.ruleId) {
                this.loadingComponant = true;
                console.log(this.type);
                let res = await getruleTemplateId({ id: this.ruleId }).catch(err => { throw err.body.message });
                console.log(res);
                if (res != null) {
                    this.rules = [...this.rules, { label: res._rule__r.Name, value: res._rule__c }];
                    this.selectedrule = res._rule__c;
                    this.selectedruleName=res._rule__r.Name;
                }
                this.getruleMergeFields(this.selectedrule);
                this.loadingComponant = false;
            }

        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }


    }

    //click on cancel button
    cancelHandler() {
        this.close({
            "res": 'close',
            "rules": this.rules
        });
    }

    //select rule in combobox
    handleSelectrule(event) {
        console.log('select rule......');
        this.selectedrule = event.detail.value;
        this.selectedruleName=event.target.options.find(opt => opt.value === event.detail.value).label;
        console.log("Name : "+this.selectedruleName);
        this.getruleMergeFields(this.selectedrule);
    }
    //get all merge fields
    getruleMergeFields(selectedruleID) {
        //update mergefields
        this.mergeFields = [];
        getMergeFields({ "ruleId": selectedruleID })
            .then(res => {
                console.log(res);
                if (res != null) {
                    let arr1 = res.split(";")
                    let mymap = new Map();
                    for (let i = 0; i < arr1.length; i++) {

                        //console.log()
                        let arr2 = arr1[i].split("(")
                        //arr2[1]=arr2[1].replace(')','')
                        let fields;
                        if (arr2.length > 1) {
                            arr2[1] = arr2[1].replace(')', '')
                            fields = arr2[1].split(",");

                            mymap.set(arr2[0].trim(), fields);
                            //console.log(arr2[0])
                            //console.log(fields)
                        }

                        //console.log(arr2)

                    }
                    if (mymap.has('Agreement_Self_Service_rule__c')) {
                        console.log(mymap.get('Agreement_Self_Service_rule__c'))
                        mymap.get('Agreement_Self_Service_rule__c').forEach(item => {
                            //console.log(item);
                            //remove not needed fields
                            let trimField = item.trim();
                            console.log(trimField);
                            if (trimField != 'APTS_rule__c' && trimField != 'Name' && trimField != 'Approval_Status__c') {
                                this.mergeFields.push({
                                    "id": this.uniqueId(),
                                    "field": trimField,
                                    "value": 14
                                })
                            }
                        }
                        );
                    }
                    else {
                        console.log("key not exist in map");
                    }

                }
                this.loadingComponant = false;
            })
            .catch(err => {
                console.log(err);
                this.log_error(err);
            })
    }

    //generate uniq id
    uniqueId = () => {
        const dateString = Date.now().toString(36);
        const randomness = Math.random().toString(36).substr(2);
        return dateString + randomness;
    };

    handleError(event) {
        let message = event.detail.detail;
        this.log_error(message);
    }

    //handle input field events
    handleInput(event) {
        try {
            console.log(event.target.value);
            this.newSelfServiceRecord[event.target.name] = event.target.value;

        }
        catch (err) {
            console.log(err);
        }
    }

    //add and udpate self service rule handler.
    async addOrUpdateHandler(event) {
        try {
            let isValid = await this.isValidating();
            console.log(isValid);
            if (isValid) {
                let action = 'Insert';

                if (this.ruleId) {
                    action = 'Update';
                    this.newSelfServiceRecord["id"] = this.ruleId;
                }
                else {
                    //during edit time, these field not need to update.
                    //this.newSelfServiceRecord["APTS_AgreementID__c"] = this.agreementId;
                    this.newSelfServiceRecord["Approval_Status__c"] = 'None';
                }
                this.newSelfServiceRecord["APTS_Agreement__c"] = this.agreementId;
                this.newSelfServiceRecord["_rule__c"] = this.selectedrule;


                console.log(JSON.stringify(this.newSelfServiceRecord));
                this.loadingComponant = true;
                console.log('insert or update payload');
                console.log(JSON.stringify(this.newSelfServiceRecord));
                console.log(action);
                console.log(this.selectedruleName);
                let res = await insertOrUpdate({
                    "data": JSON.stringify(this.newSelfServiceRecord),
                    "action": action,
                    "ruleName":this.selectedruleName
                }).catch(err => { console.log(err);throw err.body.message })
                console.log(res);
                //clode this mode
                this.loadingComponant = false;
                if (res === 'Insert') {
                    this.rules = this.rules.filter(rule => rule.value != this.selectedrule);
                    this.close({
                        "res": 'Successfully record created!',
                        "rules": this.rules
                    });
                }
                else {
                    this.rules = this.rules.filter(rule => rule.value != this.selectedrule);
                    this.close({
                        "res": 'Successfully record updated!',
                        "rules": this.rules
                    });
                }
            }
        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }

    }

    isValidating() {

        let isValid = true;
        let inputFileds = this.template.querySelectorAll('.validation');
        inputFileds.forEach(inputField => {
            //console.log(JSON.stringify(inputField));
            
            // if(inputField.name!="ruleSelection" && !this.newSelfServiceRecord.hasOwnProperty(inputField.name) && !inputField.disabled ){
            //     //console.log("condition1");
            //     inputField.reportValidity();
            //     isValid = false;
            // }
            if(inputField.name!="ruleSelection" && (inputField.value=='' || inputField.value==null) && !inputField.disabled ){
                //console.log("condition1");
                console.log(inputField.value);
                inputField.reportValidity();
                isValid = false;
            }
            if (inputField.name=="ruleSelection" && !inputField.checkValidity()) {
                //console.log("condition2");
                inputField.reportValidity();
                isValid = false;
            }
        })
        return isValid;
    }

    //enable edit page
    enableEditHandler(event) {
        this.readOnly = false;
        this.label = "Edit Self Service rule";
    }

    //log erroor
    log_error(err) {
        this.error = err;
        this.loadingComponant = false;
    }
}