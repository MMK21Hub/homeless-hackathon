def commit_or_revert(currentPLDDT, PLDDT, newseq, seq):
    if currentPLDDT > PLDDT:
        PLDDT = currentPLDDT
        seq = newseq
        decision = True
        #decision = 0
    else:
        decision = False
        #decision = PLDDT - currentPLDDT
    return decision, PLDDT, seq
#looks at current PLDDT and compares it to the current average PLDDT. If current is larger
# than average then the currentPLDDT is added to the average PLDDT and the
# function returns True. 
# If currentPLDDT is less than average then the function returns False 
# and the average PLDDT remains unchanged.
#The mutation is only committed if the currentPLDDT is greater than the average PLDDT. 