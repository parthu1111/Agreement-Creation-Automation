import { LightningElement, track, api, wire } from 'lwc';

import getParentRecordById from '@salesforce/apex/SelfServicesruleRuleController.getParentRecordById';
import createOrupdateRule from '@salesforce/apex/SelfServicesruleRuleController.createOrupdateRule';
import isToolVisibilityRuleExist from '@salesforce/apex/SelfServicesruleRuleController.isToolVisibilityRuleExist';
import getBuisnessObjectValues from '@salesforce/apex/SelfServicesruleRuleController.getBuisnessObjectValues';
import getPicklistValue from '@salesforce/apex/SelfServicesruleRuleController.getPicklistValue';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import InsertFieldModel from 'c/InsertFieldModel';


const Operators = [
    { label: 'Equal To', value: '==' },
    { label: 'Not Equal To', value: '!=' },
    { label: 'Less Than', value: '<' },
    { label: 'Less Than Or Equal To', value: '<=' },
    { label: 'Greater Than', value: '>' },
    { label: 'Greater Than Or Equal To', value: '>=' }

]
const ruleType = [
    { label: 'rule Selection Tool', value: 'rule Selection Tool' },
    { label: 'Tool Visibility', value: 'Tool Visibility' }
]

export default class ruleRuleEngine extends NavigationMixin(LightningElement) {

    @track conditionList = [];
    @track Objects=[];
    @track ruleDetail;
    @track disableruleSelection = false;
    @track visibilityDeleteButton;
    @track loadingComponant = false;
    @track errors = [];
    @api recordId;
    @api recid;
    @track defaultObjects=[];
    toolVisibilityRuleMessage='Tool visisbility Rule already existed!';
    
   constructor(){
        super();
        this.ruleDetail = {
            "ruleName": "",
            "isActive": false,
            "ruleType": "rule Selection Tool",
            "ruleSequence": null,
            "filterConditionQuery": null,
            "orgId": null,
            "isFilterUsed": false
        }

   }
    async connectedCallback() {

        try{
            //hide header
            console.log("Loading componant....");
            if(this.recid){
                //this id come from aura
                this.recordId=this.recid;
            }

            //fill business picklist
            this.loadingComponant=true;
            let res=await getBuisnessObjectValues().catch(err=>{console.log(err);});
            for(let key in res){
                // this.Objects.push({ label: res[key], value: key })
                this.defaultObjects.push( {
                    label:res[key]+">",
                    API:key,
                    type:"Reference",
                    lookupobj:key,
                    iconName:"standard:record_lookup",
                    btnStyle:"fieldIcon lookupIcon"
                })
            }
            if (this.recordId != null) {
                await this.fillDataInComponant(this.recordId);
            }
            else {
                var condition = [
                    {
                        "id": this.uniqueId(),
                        "setObject": null,
                        "setField": null,
                        "setOprator": null,
                        "setValue": null,
                        "lodingFields": true,
                        "index": 1,
                        "visibilityDeleteButton": "disableDelete"
                    }
                ]
                this.conditionList = condition;
            } 
            this.loadingComponant=false;
        }
        catch(err){
            console.log(err);
        }
    }

    renderedCallback() {
        //hide helping text on field
        const style = document.createElement('style');
        style.innerText = ".clshelptexthide div.slds-form-element__icon { display: none; } .slds-dueling-list__column_responsive .slds-dueling-list__options{ height: auto !important; min-height: 5rem !important; max-height:10rem !important;}";
        let qs = this.template.querySelectorAll('.clshelptexthide');
        for (let i = 0; i < qs.length; i++) {
            const element = qs[i];
            element.appendChild(style);
        }
        // qs = this.template.querySelectorAll('.clshelptexthide');
        // for (let i = 0; i < qs.length; i++) {
        //     const element = qs[i];
        //     console.log("tag is presented");
        // }
    }

    //get recordId from url for editing
    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        this.recordId = currentPageReference?.state?.c__recordId;
    }
    //get list of objects
    get listOfObjects() {
        return this.Objects;
    }

    //check wehter the error present or not
    get isThereAnyError() {
        return this.errors.length >= 1 ? true : false;
        //return true;
    }
    get ruleTypes() {
        return ruleType;
    }

    //get list of operators
    get listOfOperators() {
        return Operators;
    }

    //selec businessObject
    // async changeBusinessObject(event) {
    //     console.log('change object picklist');
    //     //track selected business object
    //     var foundCondition = this.conditionList.find(data => data.id == event.target.dataset.id);
    //     foundCondition.setObject = event.detail.value;
    //     foundCondition["inputAutoPopulateFeature"]=true;
    //     if(foundCondition.setObject=="Profile"){
    //         foundCondition["inputAutoPopulateFeature"]=false;
    //     }
    //     else{
    //         foundCondition["inputAutoPopulateFeature"]=true;
    //     }
    //     //console.log(foundCondition.listOfFields);

    //     //reset listoffield after change business object
    //     foundCondition.listOfFields = [];
    //     foundCondition.lodingFields = true;

    //     //fetch all fields of object
    //     getAllFieldsByObject({ objectName: foundCondition.setObject })
    //         .then(res => {
    //             //console.log(res);
    //             // for (let key in res) {
    //             //     foundCondition.listOfFields.push({ label: res[key], value: key })
    //             // }
    //             console.log(res.length);
    //             for(let i=0;i<res.length;i++){
    //                 let fieldDetail=res[i];
    //                 foundCondition.listOfFields.push({label:fieldDetail.label,value:fieldDetail.API,isFormulafield:fieldDetail.isFormualField});
    //             }
    //             //sort fields
    //             foundCondition.listOfFields.sort((a,b)=>a.label.localeCompare(b.label));
    //             //refresh listoffields so render will happen.
    //             foundCondition.listOfFields = JSON.parse(JSON.stringify(foundCondition.listOfFields));
    //             console.log('field is fetched');
    //             foundCondition.lodingFields = false;
    //             foundCondition["recordEditFormLoading"]=true;
    //         })
    //         .catch(err => {
    //             console.log(err);
    //         })

    // }

    // getAllFields(objName){
    //     let listOfFields=[];
    //     getAllFieldsByObject({ objectName: objName })
    //         .then(res => {
    //             //console.log(res);
    //             // for (let key in res) {
    //             //     foundCondition.listOfFields.push({ label: res[key], value: key })
    //             // }
    //             console.log(res.length);
    //             for(let i=0;i<res.length;i++){
    //                 let fieldDetail=res[i];
    //                 listOfFields.push({label:fieldDetail.label,value:fieldDetail.API,isFormulafield:fieldDetail.isFormualField});
    //             }
    //             //sort fields
    //             listOfFields.sort((a,b)=>a.label.localeCompare(b.label));
    //             return listOfFields;
    //         })
    //         .catch(err => {
    //             console.log(err);
    //         })
    // }

    // change value in ruletype picklist
    async changeRuleType(event) {
        try {
            this.ruleDetail.ruleType = event.detail.value;
            this.disableruleSelection = this.ruleDetail.ruleType == "Tool Visibility" ? true : false;
            //check tool visibitlity rule exist or not
        }
        catch (err) {
            this.log_error(err);
        }

    }

    //updating checkbox
    async changeActiveCheckbox(event) {
        this.ruleDetail.isActive = event.target.checked;
        try{
            let res=await this.checkToolVisibilityRuleExist();
            if(res){
                throw new Error(this.toolVisibilityRuleMessage);
            }
        }
        catch(err){
            this.log_error(err);
        }

    }
    //updating rulename
    changeRuleName(event) {
        this.ruleDetail.ruleName = event.target.value;
    }
    changeRuleSequence(event) {
        this.ruleDetail.ruleSequence = event.target.value;
    }
    //updating field
    // changeField(event) {
    //     var foundCondition = this.conditionList.find(data => data.id == event.target.dataset.id);
    //     foundCondition.setField = event.detail.value;
    //     let fieldDetail=foundCondition.listOfFields.find(item=> item.value==foundCondition.setField);
    //     if(fieldDetail.isFormulafield==true){
    //         foundCondition["inputAutoPopulateFeature"]=false;
    //     }
    //     else{
    //         foundCondition["inputAutoPopulateFeature"]=true;
    //     }
    //     //after update componat
    //     foundCondition.setValue = null;
    // }

    
    //updating value
    changeValue(event) {
        var foundCondition = this.conditionList.find(data => data.id == event.target.dataset.id);
        foundCondition.setValue = event.detail.value;
    }

    changeOperator(event) {
        var foundCondition = this.conditionList.find(data => data.id == event.target.dataset.id);
        foundCondition.setOprator = event.detail.value;
    }

    // //sequence input  handler
    // changeSequence(event) {
    //     this.setSequence = event.detail.value;
    // }

    //change value in filter input
    changeFilterCondition(event) {
        this.ruleDetail.filterConditionQuery = event.target.value;
        //console.log(this.filterCondition);
    }
    //controll filter input visibility
    filterConditionHandler(event) {
        this.ruleDetail.isFilterUsed = !this.ruleDetail.isFilterUsed;
        console.log(this.ruleDetail.isFilterUsed);
        //this.ruleDetail.isFilterUsed=this.ruleDetail.isFilterUsed=='false'?'true':'false';
        this.updateFilterConditionQuery();
    }

    //add condition on UI
    addConditionByIndex(event) {
        var condition =
        {
            "id": this.uniqueId(),
            "setObject": null,
            "setField": null,
            "listOfFields": [],
            "setOprator": null,
            "setValue": null,
            "lodingFields": true
        }


        //console.log('add condition');
        let index = event.target.dataset.index;
        console.log(index);
        this.conditionList = [
            ...this.conditionList.slice(0, index),
            condition,
            ...this.conditionList.slice(index)
        ]
        //updating index in condition list
        this.conditionList = this.conditionList.map((condition, index) => {
            return { ...condition, index: index + 1 }
        })
    }

    deleteCondition(event) {
        this.conditionList = this.conditionList.filter(condition => condition.id != event.target.dataset.id);
        // this.conditionList = this.conditionList.filter(condition =>{
        //     if(condition.id==event.target.dataset.id && condition.orgId!=null){
        //         this.listOfDeletedRecords.add(condition.orgId);
        //     }
        //     return condition.id != event.target.dataset.id;
        // });
        //updating index in condition list
        this.conditionList = this.conditionList.map((condition, index) => {
            console.log(index);
            return { ...condition, index: index + 1 }
        })
        //this.updateFilterConditionQuery();
    }

    //create rule in salesforce
    async createOrupdateRule() {

        try {


            this.errors = [];
            let isExist=await this.checkToolVisibilityRuleExist();
            if(isExist){
                throw new Error(this.toolVisibilityRuleMessage);
            }
            let rulesData = [];
            let conditionObjectFields = { "criteriaRows": [] };
            let listOfDeletedRecords=[];

            //update FilterConditon
            if (this.ruleDetail.isFilterUsed == false) {
                await this.updateFilterConditionQuery();
            }
            console.log("running save condition2");
            let isvalid = await this.isValidating();
            this.conditionList.map(condition=>{
                if(condition.setObject==null || condition.setObject==''){
                    isvalid=false;
                    const event = new ShowToastEvent({
                        "title": 'Condition is empty!',
                        "message": "",
                        "variant": 'error'
                    });
                    this.dispatchEvent(event);
                    return;
                }
            })
            if (isvalid) {
                console.log("this is valid case");
                //start loading
                this.loadingComponant = true;

                this.conditionList.map(condition => {

                    let conditionObj={
                        "BusinessObject": condition.setObject,
                        "Field": condition.setField,
                        "Operator": condition.setOprator,
                        "Value": condition.setValue,
                        "conditionNo": condition.index,
                        "inputAutoPopulateFeature":condition.inputAutoPopulateFeature,
                        "fieldWithOutRel":condition.fieldWithOutRel,
                        "fieldOfObject":condition.fieldOfObject,
                        "type":condition.type
                    }
                    //for picklist
                    if(condition.type=="MultiPicklist"){
                        console.log("detect picklist");
                        let arrtostr='';
                        condition.setValue.map(item=>{
                            arrtostr=arrtostr+item+";"
                        })
                        conditionObj["Value"]=arrtostr;
                    }
                    conditionObjectFields.criteriaRows.push(conditionObj);
                })
                //store condition in json formate
                this.ruleDetail["condition"] = JSON.stringify(conditionObjectFields);
                
                //fetch all selected rules from child componant
                if (this.ruleDetail.ruleType == 'rule Selection Tool') {
                    let selectedAndDeletedrules = await this.template.querySelector("c--rule-lookup").getSelectedAndDeletedrules();
                    console.log(selectedAndDeletedrules);
                    let selectedrules=selectedAndDeletedrules.rules;
                    selectedrules.map(ruleitem => {
                        console.log("rule orgId : " + ruleitem.orgId);
                        rulesData.push({
                            "ruleName": ruleitem.name,
                            "ruleId": ruleitem.recordId,
                            "isAutoIncluded": ruleitem.isAutoIncluded,
                            "orgId": ruleitem.orgId
                        })
                    })
                    listOfDeletedRecords=selectedAndDeletedrules.deletedrules;
                    console.log(JSON.stringify(listOfDeletedRecords));
                }

                console.log("call apex method .... " + this.ruleDetail.orgId);
                createOrupdateRule({
                    "RuleEngineObj": this.ruleDetail,
                    "ChildRecords": rulesData,
                    "deletedRecords":listOfDeletedRecords
                })
                    .then(res => {
                        console.log("Created/Updated Record ID : " + res);
                        //show tost event
                        let title = "Rule Successfully Created!";
                        if (this.recordId != null) {
                            title = "Rule Successfully Updated!"
                        }
                        const event = new ShowToastEvent({
                            "title": title,
                            "message": "",
                            "variant": 'success'
                        });
                        this.dispatchEvent(event);
                        //redirect to record page.
                        setTimeout(() => {
                            this[NavigationMixin.Navigate]({
                                type: 'standard__recordPage',
                                attributes: {
                                    recordId: res,
                                    objectApiName: '_rule_RuleEngine__c',
                                    actionName: 'view'
                                }
                            });
                        }, 2000);
                    })
                    .catch(err => {
                        console.log(err.body.message);
                        throw err.body.message;
                    })
            }
        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }

    closeAction() {
        console.log("close Action called...");
        //console.log(this.objectInfo);
        //this.fillDataInChildComponant();
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: '_rule_RuleEngine__c',
                actionName: 'list'
            }
        });
    }

    //this method create default entry in filter input
    updateFilterConditionQuery() {
        let query = "1";
        if (this.conditionList.length >= 2) {
            for (let i = 1; i < this.conditionList.length; i++) {
                let ind = i + 1;
                query = query + " AND " + ind;
            }
        }
        this.ruleDetail.filterConditionQuery = query;
    }
    //fetch rules from child to parent
    /*allSelectedrules(event) {
        this.selectedrules = event.detail.rules;
        //console.log("parent object : "+rules.length);
    }*/


    //validating componant before create or update action
    isValidating() {
        let isValid = true;
        console.log("validation running....");
        let inputFileds = this.template.querySelectorAll('.validation');
        inputFileds.forEach(inputField => {
            // console.log("name : " + inputField.name);
            // console.log("class : "+inputField.class);
            // console.log("value :"+inputField.value);
            console.log(JSON.toString(inputField));
            if (!inputField.checkValidity()) {
                inputField.reportValidity();
                isValid = false;
            }
            console.log(inputField.name);
        })

        //check child componant validation.
        if (this.ruleDetail.ruleType == 'rule Selection Tool') {
            isValid = this.template.querySelector("c--rule-lookup").isValidInChild();
        }
        console.log("child Componant result :" + isValid);
        return isValid;

    }
    //generate uniq id
    uniqueId = () => {
        const dateString = Date.now().toString(36);
        const randomness = Math.random().toString(36).substr(2);
        return dateString + randomness;
    };

    //for logging error
    log_error(errMassage) {
        this.errors = [...this.errors, errMassage];
        //stop loading and display error on componant
        this.loadingComponant = false;
    }
    logErrorByChild(event) {
        console.log('log error by child');
        this.errors = [...this.errors, event.detail.Error];
        //stop loading and display error on componant
        this.loadingComponant = false;
    }

    //fetch rule and disply on componant for editing.
    async fillDataInComponant(recordId) {
        try {
            console.log("fill the data in componant ...");
            await getParentRecordById({
                recordId: recordId
            })
                .then(async res => {

                    //fill rule details on componant
                    this.ruleDetail = {
                        "ruleName": res.Name,
                        "isActive": res.isActive__c,
                        "ruleType": res.Rule_Type__c,
                        "ruleSequence": res.Sequence__c,
                        "filterConditionQuery": res.Advance_Filter_Condition__c,
                        "orgId": res.Id,
                        "isFilterUsed": res.isFilterUsed__c
                    }
                    //update disableruleSelection
                    this.disableruleSelection = this.ruleDetail.ruleType == "Tool Visibility" ? true : false;
                    //this.filterInputVisibility=res.isFilterUsed__c;

                    //fill condition on componant
                    this.conditionList = [];
                    let jsonCondition = JSON.parse(res.Conditions__c);
                    //console.log(jsonCondition[0].BusinessObject);
                    let result = await Promise.all(
                        jsonCondition.criteriaRows.map(async (condition, index) => {
                            console.log("waiting start....+" + condition.BusinessObject);
                            let listoffileds = [];
                            let ruleobj={};
                            
                            // let res1 = await getAllFieldsByObject({ "objectName": condition.BusinessObject }).catch(err => console.log(err));
                            // for(let i=0;i<res1.length;i++){
                            //     let fieldDetail=res1[i];
                            //     listoffileds.push({label:fieldDetail.label,value:fieldDetail.API,isFormulafield:fieldDetail.isFormualField});
                            //     if(condition.Field==fieldDetail.API && fieldDetail.isFormualField){
                            //         ruleobj["inputAutoPopulateFeature"]=false;
                            //     }
                            // }
                            //sort fields
                            //listoffileds.sort((a,b)=>a.label.localeCompare(b.label));
                            //listoffileds=this.getAllFields(condition.BusinessObject);
                            ruleobj = {
                                "id": this.uniqueId(),
                                "setObject": condition.BusinessObject,
                                "setField": condition.Field,
                                "setOprator": condition.Operator,
                                "setValue": condition.Value,
                                "lodingFields": false,
                                "index": condition.conditionNo,
                                "recordEditFormLoading":true,
                                "inputAutoPopulateFeature":condition.inputAutoPopulateFeature,
                                "fieldWithOutRel":condition.fieldWithOutRel,
                                "fieldOfObject":condition.fieldOfObject,
                                "type":condition.type,
                                "ismultipicklist":false,
                                "isPicklist":false,
                                "picklistoption":null


                            }
                            // if(condition.BusinessObject=="Profile"){
                            //     ruleobj["inputAutoPopulateFeature"]=false;
                            // }
                            if (index == 0) {
                                ruleobj["visibilityDeleteButton"] = "disableDelete";
                            }
                            else {
                                ruleobj["visibilityDeleteButton"] = null;
                            }

                            if(condition.type=="MultiPicklist"){
                                ruleobj["ismultipicklist"]=true;
                                ruleobj["picklistoption"]=[];
                                let picklistFields=await getPicklistValue({objectName:condition.fieldOfObject,fieldName:condition.fieldWithOutRel}).catch(err=>console.log(err));
                                // console.log(picklistFields.length);
                                // for(let i=0;i<picklistFields.length;i++){
                                //     ruleobj["picklistoption"].push({ label: picklistFields[i], value: picklistFields[i] })
                                // }
                                for(let key in picklistFields){
                                    console.log(key);
                                    ruleobj["picklistoption"].push({ label: picklistFields[key], value: key })
                                }
                                let selectedpicklistval=condition.Value.split(";");
                                console.log("selectedpicklistval :"+selectedpicklistval.length);
                                ruleobj.setValue=[];
                                for(let j=0;j<selectedpicklistval.length-1;j++){
                                    ruleobj.setValue.push(selectedpicklistval[j]);
                                }
                                console.log(ruleobj.setValue);
                            }
                            if(condition.type=="Picklist"){
                                ruleobj["isPicklist"]=true;
                                ruleobj["picklistoption"]=[];
                                let picklistFields=await getPicklistValue({objectName:condition.fieldOfObject,fieldName:condition.fieldWithOutRel}).catch(err=>console.log(err));
                                // for(let i=0;i<picklistFields.length;i++){
                                //     ruleobj["picklistoption"].push({ label: picklistFields[i], value: picklistFields[i] })
                                // }
                                for(let key in picklistFields){
                                    console.log(key);
                                    ruleobj["picklistoption"].push({ label: picklistFields[key], value: key })
                                }
                            }
                            return ruleobj;
                            //console.log("waiting end....");
                        })
                    )
                    this.conditionList = result;
                    //this.loadingComponant = false;

                })
                .catch(err => {
                    console.log(err);
                    throw err.body.message;
                })
            console.log("fetching end......");
        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }
    recordEditFormDataLoad(event){
        console.log("recordEditFormDataLoad");
        var foundCondition = this.conditionList.find(data => data.id == event.target.dataset.id);
        foundCondition["recordEditFormLoading"]=false;
        this.loadingComponant=false;
    }
    async checkToolVisibilityRuleExist() {
        try {
            if (this.ruleDetail.ruleType == "Tool Visibility") {
                this.loadingComponant = true;
                //try {
                    let res = await isToolVisibilityRuleExist().catch(err => { throw err.body.message })
                    this.loadingComponant = false;
                    return res;
                    // if (res) {
                    //     console.log(1);
                    //     throw new Error('Tool visisbility Rule already existed!');

                    // }
                //}
                /*catch (err) {
                    console.log(2);
                    console.log(err);
                    throw err;
                }*/
                

            }
        }
        catch (err) {
            console.log(3);
            //console.log(err);
            this.log_error(err);
        }


    }

    async insertFieldHanlder(event){

        try{
            console.log("insertFieldHandler");
            let index=event.target.dataset.index-1;
            //console.log(event.target.dataset.id);
            const fieldModel=await InsertFieldModel.open({
                size: 'small',
                label:'insert field model',
                defaultObjects:this.defaultObjects
            });
            console.log(JSON.stringify(fieldModel));
            
            if(fieldModel){
                var foundCondition = this.conditionList[index];
                
                //foundCondition["setFullFieldPath"]=fieldModel.selectedField;
                foundCondition["setField"]=fieldModel.selectedField;
                foundCondition["setValue"]=null;
                foundCondition["setOprator"]=null;
                foundCondition["lodingFields"]=false;
                if(fieldModel.selectedField.includes(".")){
                    const parts=fieldModel.selectedField.split(".");
                    foundCondition["fieldWithOutRel"]=parts[parts.length-1];
                }
                else{
                    foundCondition["fieldWithOutRel"] = fieldModel.selectedField;
                }
                foundCondition.setObject=fieldModel.selectedObject;
                foundCondition["fieldOfObject"]=fieldModel.fieldOfObject;
                foundCondition["type"]=fieldModel.type;

                if(fieldModel.fieldOfObject=="Profile" || fieldModel.isFormulaField=="true"){
                    foundCondition["inputAutoPopulateFeature"]=false;
                }
                else{
                    foundCondition["inputAutoPopulateFeature"]=true;
                    console.log("inputAutoPopulateFeature-> true");
                }
                
                if(fieldModel.type=="MultiPicklist" || fieldModel.type=="Picklist"){
                    if(fieldModel.type=="MultiPicklist"){
                        foundCondition["ismultipicklist"]=true;
                    }
                    else{
                        foundCondition["isPicklist"]=true;
                    }
                    foundCondition["picklistoption"]=[];
                    // const valuelist=fieldModel.picklistval.split(",");
                    // valuelist.map(item=>{
                    //     console.log(item);
                    //     foundCondition["picklistoption"].push({ label: item, value: item })
                    // })
                    console.log("picklist : "+fieldModel.picklistval);
                    fieldModel.picklistval=JSON.parse(fieldModel.picklistval);
                    for(let key in fieldModel.picklistval){
                        console.log(key);
                        foundCondition["picklistoption"].push({ label:fieldModel.picklistval[key] , value: key })
                    }
                }
                foundCondition["recordEditFormLoading"]=true;
                            
            }
        }
        catch(err){
            console.log(err);
        }
    }


}