
package com.smartcomplaint.complaintmanagement.controller;
import com.smartcomplaint.complaintmanagement.model.ComplaintStatus;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartcomplaint.complaintmanagement.model.Complaint;
import com.smartcomplaint.complaintmanagement.service.ComplaintService;
import org.springframework.web.bind.annotation.CrossOrigin;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/complaints")


public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<Complaint> createComplaint(
            @RequestBody Complaint complaint) {

        Complaint saved = complaintService.createComplaint(complaint);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public List<Complaint> getAllComplaints() {
        return complaintService.getAllComplaints();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(
            @PathVariable Integer id) {

        Complaint complaint = complaintService.getComplaintById(id);

        if (complaint == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(complaint);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Complaint> updateComplaint(
            @PathVariable Integer id,
            @RequestBody Complaint complaint) {

        Complaint updated = complaintService.updateComplaint(id, complaint);

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplaint(
            @PathVariable Integer id) {

        boolean deleted = complaintService.deleteComplaint(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{id}/status")
    public ResponseEntity<Complaint> updateStatus(
            @PathVariable Integer id,
            @RequestParam ComplaintStatus status) {

        Complaint updated =
                complaintService.updateComplaintStatus(id, status);

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }
}