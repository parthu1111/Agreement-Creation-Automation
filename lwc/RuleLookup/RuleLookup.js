import { LightningElement, api, track } from 'lwc';
import searchrules from '@salesforce/apex/SelfServicesruleRuleController.searchrules';
import getChildRecordsByParentId from '@salesforce/apex/SelfServicesruleRuleController.getChildRecordsByParentId';


const objectApiName = 'Apttus__APTS_Template__c';
export default class ruleLookup extends LightningElement {

    @track message;
    @track recordsList;
    @track searchKey = "";
    @api selectedValue;
    @api selectedRecordId;
    @api parentrecordid;
    @track rules = [];
    listOfDeletedRecords = [];

    connectedCallback() {

        //rules object
        //console.log("loading child componant**********");
        this.rules = [{
            "id": this.uniqueId(),
            "name": null,
            "recordId": null,
            "searchkey": null,
            "recordsList": null,
            "displayDeleteAction": "NoDisplayDelete",
            "isAutoIncluded": false,
            "orgId": null
        }]

        if (this.parentrecordid != null) {
            console.log(this.parentrecordid);
            this.fillDataInChildComponant();
        }
    }

    handleKeyChange(event) {
        //console.log(event.target.dataset.id);
        let findrule = this.rules.find(rule => rule.id == event.target.dataset.id);
        findrule.searchkey = event.target.value;
        this.getLookupResult(findrule.searchkey, findrule);
    }

    getLookupResult(searchkeyparameter, findrule) {

        console.log("getLookupResult runing....");
        searchrules({ searchKey: searchkeyparameter })
            .then((result) => {
                if (result.length === 0) {
                    //this.recordsList = [];
                    findrule.recordsList = [];
                    this.message = "No Records Found";
                } else {
                    //this.recordsList = result;
                    findrule.recordsList = result;
                    this.message = "";
                }
                this.error = undefined;
            })
            .catch((error) => {
                this.error = error;
                findrule.recordsList = undefined;
            });

        //console.log(JSON.stringify(this.rules));
    }

    changeIsAutoIncluded(event) {
        let rule = this.rules.find(rule => rule.id == event.target.dataset.id);
        rule.isAutoIncluded = event.target.checked;
        console.log(rule.isAutoIncluded);
    }
    onLeave(event) {
        console.log(event.target.dataset.id);
        let findrule = this.rules.find(rule => rule.id == event.target.dataset.id);
        setTimeout(() => {
            findrule.searchkey = null;
            //console.log('remove search key');
            findrule.recordsList = null;
        }, 300);
    }
    //select the value from search
    onRecordSelection(event) {

        let findrule = this.rules.find(rule => rule.id == event.target.dataset.id);
        findrule.name = event.target.dataset.name;
        findrule.recordId = event.target.dataset.key;
        findrule.recordsList = null;
        findrule.searchkey = null;
        //this.rules.map(x=>console.log("selected rule : "+x.name));
        //this.updateSelectedrules();

    }

    //remove selected lookup
    removeRecordOnLookup(event) {
        //console.log('remove lookup : ' + event.target.dataset.id);
        let findrule = this.rules.find(rule => rule.id == event.target.dataset.id);
        findrule.searchkey = null;
        findrule.name = null;
        findrule.recordId = null;
        findrule.recordsList = null;
        //this.onSeletedRecordUpdate(); 
        // this.updateSelectedrules();
    }

    uniqueId = () => {
        const dateString = Date.now().toString(36);
        const randomness = Math.random().toString(36).substr(2);
        return dateString + randomness;
    };

    addrule(event) {
        let rule = {
            "id": this.uniqueId(),
            "name": null,
            "label": null,
            "recordId": null,
            "searchkey": null,
            "recordsList": null,
            "displayDeleteAction": '',
            "isAutoIncluded": false,
            "orgId": null
        }
        this.rules = [...this.rules, rule];
    }

    deleterule(event) {
        //this.rules = this.rules.filter(rule => rule.id != event.target.dataset.id);
        try {
            this.rules = this.rules.filter(rule => {
                if (rule.id == event.target.dataset.id && rule.orgId != null) {
                    this.listOfDeletedRecords.push(rule.orgId);
                }
                return rule.id != event.target.dataset.id;
            });
            console.log(this.listOfDeletedRecords);
        }
        catch (err) {
            console.log(err);
            this.log_err(err);
        }
    }
    //return all deleted rules for update in salesforce
    @api getDeletedrules() {
        console.log(this.listOfDeletedRecords);
        return this.listOfDeletedRecords;
    }
    //provide rule data to parent componant
    @api getSelectedAndDeletedrules() {
        return {
            "rules": this.rules,
            "deletedrules": this.listOfDeletedRecords
        }
    }

    @api isValidInChild() {
        let isValid = true;
        console.log("child componant validation running....");
        let inputFileds = this.template.querySelectorAll('.validation');
        inputFileds.forEach(inputField => {
            if (!inputField.checkValidity()) {
                //inputField.setCustomValidity("pls select rule");
                inputField.reportValidity();
                isValid = false;
            }
        })

        return isValid;
    }
    fillDataInChildComponant() {
        try {
            console.log("fillDataInChildComponant method called.....");
            //throw "custom error";
            getChildRecordsByParentId({ "recordId": this.parentrecordid })
                .then(res => {
                    console.log("fillDataInChildComponant res: ");
                    console.log(res);

                    this.rules = res.map((rule, index) => {
                        let ruleobj = {
                            "id": this.uniqueId(),
                            "name": rule.Name,
                            "recordId": rule.rule__c,
                            "searchkey": null,
                            "recordsList": null,
                            "isAutoIncluded": rule.Is_Auto_Included__c,
                            "orgId": rule.Id
                        }
                        if (index == 0) {
                            ruleobj["displayDeleteAction"] = "NoDisplayDelete"
                        }
                        else {
                            ruleobj["displayDeleteAction"] = null
                        }
                        return ruleobj;
                    })

                })
                .catch(err => {
                    console.log(err);
                    throw err.body.message;
                })

        }
        catch (err) {
            console.log(err);
            this.log_err(err);
        }

    }

    log_err(errMassage) {
        let paramData = { Error: errMassage };
        let ev = new CustomEvent('logerror',
            { detail: paramData }
        );
        this.dispatchEvent(ev);
    }
}