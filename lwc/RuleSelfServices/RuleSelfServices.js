import { LightningElement, api, track, wire } from 'lwc';
import getAgreementruleSelfServiceRecordFromApex from '@salesforce/apex/SelfServiceruleRuleHelperClass.getAgreementruleSelfServiceRecord';
import deleteRecordById from '@salesforce/apex/SelfServiceruleRuleHelperClass.deleteRecordById';
import checkForToolVisiblityMatch from '@salesforce/apex/SelfServiceruleRuleHelperClass.checkForToolVisiblityMatch';
import getAgreementData from '@salesforce/apex/SelfServiceruleRuleHelperClass.getAgreementData';
import checkForAvailablerules from '@salesforce/apex/SelfServiceruleRuleHelperClass.checkForAvailablerules';
import getCustomSetting from '@salesforce/apex/SelfServiceruleRuleHelperClass.getCustomSetting';
import bulkApprovalForSelectedRecords from '@salesforce/apex/SelfServiceruleRuleHelperClass.bulkApprovalForSelectedRecords';
import { NavigationMixin, CurrentPageReference } from "lightning/navigation";
import ruleSelfServicePopup from "c/ruleSelfServicePopup";
import ruleSelfServiceApprovalSubmission from "c/ruleSelfServiceApprovalSubmission";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ToolVisibilityMessage from '@salesforce/label/c.ToolVisibilityMessage';
import { registerListener, unregisterAllListeners } from 'c/pubsub';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import METADATA_OBJECT from '@salesforce/schema/_Self_Service_rule_Setting__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

// import { refreshApex } from '@salesforce/apex';
const actions = [
    { label: 'View', name: 'view' },
    { label: 'Edit', name: 'edit' },
    // { label: 'Delete', name: 'delete' },
    { label: 'Preview & Submit Approvals', name: 'submtiApproval' },
    {label:'My Approval',name:'myApproval'},
    { label: 'Cancel rule/Reset Approval Status', name: 'cancelruleflow' }
];

const columns = [
    {
        fieldName: 'Id', type: "dataTableCustomCheckbox", fixedWidth: 35, hideLabel: true, sortable: false,
        typeAttributes: { Id: { fieldName: "Id" }, disabled: { fieldName: "isDisabled" } }
    },
    {
        label: 'Self Service rule', fieldName: 'Id', type: "ruleSelfServiceViewLink",
        typeAttributes: { ruleName: { fieldName: "_rule_Name__c" }, recordId: { fieldName: "Id" } }
    },
    { label: 'rule Family', fieldName: '_rule_Family__c' },
    { label: 'Auto Included?', fieldName: '_Auto_Included__c' },
    { label: 'Remove rule', fieldName: '_Is_Excluded__c' },
    { label: 'Approval Status', fieldName: 'Approval_Status__c' },
    {
        type: 'action',
        typeAttributes: { rowActions: actions },
    }
]

export default class ruleSelfServices extends NavigationMixin(LightningElement) {

    @api recordId;
    @track isToolVisible = true;
    @track loadingComponant = false;
    @track columns = columns;
    @track numberOfRecord = 0;
    @track agreementCluaseSelfServiceRecords = [];
    BASE_URL = null;
    @track rules = [];
    @track error;
    @track flowInputVariables;
    @track isCancelFlow = false;
    @track ToolVisibilityMessage = null;
    @api channelName = '/event/Agreement_Self_Service_rule2__e';
    subscription = {};
    selectedRow = new Set();
    preventToRefresh=false;

    constructor() {
        super();
        this.loadingComponant = true;
    }
    // @wire(getObjectInfo, { objectApiName: METADATA_OBJECT })
    // metadataInfo({data,err}){
    //     if(data){
    //         console.log('metadata3***********');
    //         console.log(JSON.stringify(data.recordTypeInfos));
    //     }
    //     else if(err){
    //         console.log(err);
    //     }
    // }
    
    // @wire(getRecord, {
    //     recordId: 'latest',
    //     fields:['_Self_Service_rule_Settings__mdt.Regenerate_Banner_Message__c']
    // })
    // customMetadataRecord({data,err}){
    //     console.log('custom metadatatype 0.1');
    //     if(data){
    //         console.log(data);
    //     }
    // }
    /*
    @wire(getRelatedListRecords,{
        parentRecordId:'a3I8K00000055eaUAA',
        relatedListId:'Agreement_Self_Service_rules__r',
        fields:['Agreement_Self_Service_rule__c.Id']
    })
    listInfo({error,data}){
        console.log("updated wire called");
        if(data){
            console.log("data is found");
            console.log(JSON.stringify(data.records));
            this.testindData=data.records;
        }
        else if(error){
            console.log(JSON.stringify(error));
            console.log("error in wired api");
        }
    }*/

    //for refresh the componant
    @wire(getRecord, { recordId: '$recordId', fields: ['Apttus__APTS_Agreement__c.Name'] })
    agreementData({ data, error }) {
        if (data) {
            if(this.preventToRefresh==false){
                console.log("refresh the componant...");
                this.init();
            } 
            //reset it again
            this.preventToRefresh=false;
        }
        else if (error) {
            console.log(JSON.stringify(error));
        }
    }
    async connectedCallback() {
        console.log('loading componant......');
        //await this.init();
        this.handleSubscribe();
    }


    handleSubscribe() {
        subscribe(this.channelName, -1, this.messageCallback).then(response => {
            console.log('Subscription request sent to: ', JSON.stringify(response.channel));
            this.subscription = response;
        });
    }
    messageCallback = (response) =>{
        try {
            console.log("event called");
            //console.log(response.data.payload.Id__c);
            //console.log(JSON.stringify(this.agreementCluaseSelfServiceRecords));
            console.log(typeof this.agreementCluaseSelfServiceRecords);
            let record = this.agreementCluaseSelfServiceRecords.find(item => item.Id == response.data.payload.Id__c);
            console.log(record.Approval_Status__c);
            record.Approval_Status__c = response.data.payload.approval_status__c;
            record.isDisabled = true;
            //this.agreementCluaseSelfServiceRecords=JSON.parse(JSON.stringify(this.agreementCluaseSelfServiceRecords));
            this.agreementCluaseSelfServiceRecords=[...this.agreementCluaseSelfServiceRecords];
            console.log("data is updated");
            //this.getAgreementruleSelfServiceRecord();
        }
        catch (err) {
            console.log(err);
        }
    }
    disconnectedCallback() {
        this.handleUnsubscribe();
    }
    handleUnsubscribe() {

        // Invoke unsubscribe method of empApi
        unsubscribe(this.subscription, response => {
            console.log('unsubscribe() response: ', JSON.stringify(response));
            // Response is true for successful unsubscribe
        });
    }

    async init() {
        try {

            this.BASE_URL = window.location.origin;
            this.loadingComponant = true;
            this.error = null;
            let res = await checkForToolVisiblityMatch({ 'agrId': this.recordId }).catch(err => { throw err.body.message });
            console.log("response : " + res);
            if (res === 'TRUE') {
                this.isToolVisible = true;
                //get availablerules for add.
                await this.getAgreementruleSelfServiceRecord();
                await this.getAllAvailablerules();
                //console.log("finished getAllAvailablerules");
                // get records
                //await this.getAgreementruleSelfServiceRecord();
                //console.log("finished getAgreementruleSelfServiceRecord");
                this.loadingComponant = false;
            }
            else {
                await getCustomSetting()
                .then(res=>{
                    console.log(res);
                    this.ToolVisibilityMessage=res!=null?res[0].Tool_Visibility_Message__c:'something went wrong!';
                    this.isToolVisible = false;
                    this.loadingComponant=false;
                }).catch(err=>this.log_error(err));
                // await getToolVisibilityMessage()
                // .then(res=>{
                //     this.ToolVisibilityMessage=res;
                //     this.isToolVisible = false;
                //     this.loadingComponant=false;
                // }).catch(err=>this.log_error(err));
                

            }
            console.log("init finished.....");

        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }
    async getAllAvailablerules() {
        //get availablerules for add.
        //let ruleData = await checkForAvailablerules({ "agrId": this.recordId }).catch(err => { throw err.body.message })
        let agreementData=await getAgreementData({ "agreementId": this.recordId }).catch(err => { throw err.body.message });
        let ruleData=agreementData._available_rules__c;
        console.log("CluaseData");
        console.log(ruleData);
        ruleData=JSON.parse(ruleData);
        //initialize the available rules.
        this.rules = [];
        for (let key in ruleData) {
            let findObj=this.agreementCluaseSelfServiceRecords.find(item=>item['_rule__c']===key)
            if(!findObj){
                this.rules.push({ label: ruleData[key], value: key })
            }
        }

    }
    async getAgreementruleSelfServiceRecord() {
        // get records
        let data = await getAgreementruleSelfServiceRecordFromApex({ "agreementId": this.recordId }).catch(err => { throw err.body.message })
        //console.log("records");
        //console.log(data);
        this.numberOfRecord = data.length;
        console.log(this.numberOfRecord);
        data = data.map(item => {
            let record = { ...item, "URL": this.BASE_URL + "/lightning/r/" + item.Id + "/view", "isDisabled": true }
            if(item._rule__c!=null){
                record["_rule_Name__c"]=item._rule__r.Name;
            }
            else{
                record["_rule_Name__c"]=null;
            }
            if (item.Approval_Status__c == "Approval Required") {
                record["isDisabled"] = false;
            }
            else{
                record["isDisabled"] = true;
            }
            return record;
        })
        //console.log(JSON.stringify(data));
        this.agreementCluaseSelfServiceRecords = data;

    }

    async handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        console.log(actionName);
        console.log(row.Id);
        switch (actionName) {
            case 'delete':
                this.deleteRow(row);
                break;
            case 'edit':
                console.log("edit action call");
                await this.editDataTableRecord(row);
                break;
            case 'view':
                await this.viewDataTableRecord(row);
                break;
            case 'submtiApproval':
                await this.previewAndSubmitApproval(row);
                break;
            case 'cancelruleflow':
                await this.openCancleFlow(row);
                break;
            case 'myApproval':
                await this.openMyApprovalPage(row); 
                break;
            default:
        }
    }


    //open popup for add rules
    async addruleHandler() {

        try {
            console.log("addruleHandler");
            let res = await ruleSelfServicePopup.open({
                size: 'large',
                agreementId: this.recordId,
                label: "Add New Self Service rule",
                rules: this.rules,
                type: 'edit'
            });

            if (res && res.res !== 'close') {
                //update avialable rule list
                this.rules = res.rules;
                this.toastMessage(res, 'success');
                this.loadingComponant = true;
                //update data 
                await this.getAgreementruleSelfServiceRecord().catch(err => { throw err.body.message });
                this.loadingComponant = false;
            }
        } catch (err) {
            console.log(err);
            this.log_error(err);
        }

    }

    async editDataTableRecord(row) {
        try {
            const { Id } = row;
            console.log("editfunction2 :" + Id);
            this.preventToRefresh=true;
            let res = await ruleSelfServicePopup.open({
                size: 'large',
                agreementId: this.recordId,
                ruleId: Id,
                label: "Edit Self Service rule",
                rules: this.rules,
                type: 'edit'
            });
            console.log(res);
            if (res && res.res !== 'close') {
                //update avialable rule list
                this.rules = res.rules;
                this.toastMessage(res, 'success');
                this.loadingComponant = true;
                //update data 
                await this.getAgreementruleSelfServiceRecord().catch(err => { throw err.body.message });
                this.loadingComponant = false;

            }

        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }

    //view record
    async viewDataTableRecord(row) {
        try {

            const { Id } = row;
            console.log("editfunction2 :" + Id);
            this.preventToRefresh=true;
            let res = await ruleSelfServicePopup.open({
                size: 'large',
                agreementId: this.recordId,
                ruleId: Id,
                label: "View Self Service rule",
                rules: this.rules,
                type: 'view'
            });
            console.log(res);
            if (res && res.res !== 'close') {
                this.rules = res.rules;
                this.toastMessage(res, 'success');
                this.loadingComponant = true;
                //update data and available rules
                await this.getAgreementruleSelfServiceRecord().catch(err => { throw err.body.message });
                this.loadingComponant = false;
            }
        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }

    //delete record
    async deleteRow(row) {
        try {
            const { Id, _rule_Name__c, _rule__c } = row;
            this.loadingComponant = true;
            let res = await deleteRecordById({ id: Id }).catch(err => { err.body.message });
            console.log(res);
            if (res == 'success') {
                this.toastMessage('Successfully record is deleted!', 'success');
            }
            await this.getAgreementruleSelfServiceRecord().catch(err => { throw err.body.message });
            this.rules.push({ label: _rule_Name__c, value: _rule__c })
            this.loadingComponant = false;
        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }

    //submit approval using oob functionallity
    previewAndSubmitApproval(row) {
        try {
            const { Id } = row;
            const url = '/apex/Apttus_Approval__PreviewSubmitApprovals?Id=' + Id + '&hideSubmitWithAttachments=true';
            window.open(url,"_blank");
            // this[NavigationMixin.Navigate]({
            //     type: 'standard__webPage',
            //     attributes: {
            //         url: url
            //     }
            // })
        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }

    openMyApprovalPage(row){
        try {
            const { Id } = row;
            const url = '/apex/Apttus_Approval__MyApprovals?id=' + Id;
            window.open(url,"_blank");
            // this[NavigationMixin.Navigate]({
            //     type: 'standard__webPage',
            //     attributes: {
            //         url: url
            //     }
            // })
        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }

    //open flow
    openCancleFlow(row) {
        try {
            const { Id } = row;
            this.flowInputVariables = [
                {
                    name: "recordId",
                    type: "String",
                    value: Id,
                },
            ];
            this.isCancelFlow = true;
        }
        catch (err) {
            console.log(err);
            this.log_error(err);
        }
    }
    //flow handler event
    handleFlowStatusChange(event) {
        console.log("flow status", event.detail.status);
        if (event.detail.status === "FINISHED") {
            this.isCancelFlow = false;
        }
    }
    //redirect to related list
    redirectToRelatedList() {
        console.log("called view all function");
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Apttus__APTS_Agreement__c',
                relationshipApiName: 'Agreement_Self_Service_rules__r',
                actionName: 'view'
            },
        });
    }

    //this function is called by datatable custom event
    handleViewRecord(event) {
        //this.preventToRefresh=true;
        console.log("handletestmethod");
        const row = { Id: event.detail.Id };
        this.viewDataTableRecord(row);

    }

    async submitForApproval(event) {

        //var selectedRecords = this.template.querySelector("c-custom-table-for-rule-self-service").getSelectedRows();

        if (this.selectedRow.size > 0) {

            let recordIds = [];
            let selectedRecords = this.agreementCluaseSelfServiceRecords.filter(item => this.selectedRow.has(item.Id));
            selectedRecords.map(item => {
                recordIds.push({ Name: item._rule_Name__c, Id: item.Id, comment: "", status: item.Approval_Status__c })
            });
            //recordIds=recordIds.map(item=>({...item,"comment":""}));
            console.log(JSON.stringify(recordIds));
            let res = await ruleSelfServiceApprovalSubmission.open({
                size: 'medium',
                label: "Approval Submission Conmments",
                records: recordIds
            })
            console.log(JSON.stringify(res));
            if (res) {

                if (res.isSuccess) {
                    this.toastMessage('Successfully Approval has been submitted', 'success');
                }
                else {
                    this.toastMessage('something went wrong in approval submission', 'error');
                }
            }
        }
        else {
            this.toastMessage('Plese Select Records before submit approval', 'error');
        }
    }


    handlecheckboxevent(event) {
        try {
            console.log(event.detail.state);
            if (event.detail.state == true) {
                console.log(event.detail.Id);
                this.selectedRow.add(event.detail.Id);
            }
            else {
                if (this.selectedRow.has(event.detail.Id)) {
                    this.selectedRow.delete(event.detail.Id);
                }
            }
            console.log(this.selectedRow);
        }
        catch (err) {
            console.log(err);
        }
    }



    toastMessage(title, type) {
        const event = new ShowToastEvent({
            title: title,
            variant: type
        });
        this.dispatchEvent(event);
    }

    log_error(err) {
        this.error = err;
        this.loadingComponant = false;
    }

}