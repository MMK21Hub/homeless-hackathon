def apply_mutation(seq, position, new_letter):
    newseq = seq
    newseq[position] = new_letter
    return seq, newseq
#changing a specific letter in a sequence to a new letter and returning the new sequence.
